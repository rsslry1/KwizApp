import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/security'
import { QuizStatus } from '@prisma/client'

// Helper function to verify instructor access
async function verifyInstructorAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)

  if (!payload || payload.role !== 'INSTRUCTOR') {
    return null
  }

  // Get instructor with class assignments
  const instructor = await db.instructor.findUnique({
    where: { userId: payload.userId },
  })

  if (!instructor) {
    return null
  }

  const classIds = instructor.classIds?.split(',').filter(Boolean) || []

  return { ...payload, classIds, instructorId: instructor.id }
}

// PUT update quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quizId } = params
    const requestBody = await request.json()
    
    console.log('=== Quiz Update API Debug ===')
    console.log('Quiz ID:', quizId)
    console.log('Request body:', requestBody)
    console.log('Questions in request:', requestBody.questions)
    console.log('Questions type:', typeof requestBody.questions)
    console.log('Questions is array:', Array.isArray(requestBody.questions))

    const {
      title,
      description,
      instructions,
      questions,
      timeLimit,
      allowedAttempts,
      passingScore,
      showResults,
      shuffleQuestions,
      randomizeOptions,
      availableFrom,
      availableUntil,
      fullscreenMode,
      disableCopyPaste,
      requireProctoring,
      classIds,
      status,
    } = requestBody

    // Fetch existing quiz
    const existingQuiz = await db.quiz.findUnique({
      where: { id: quizId },
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if instructor created this quiz
    if (existingQuiz.createdById !== instructorUser.instructorId) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this quiz' },
        { status: 403 }
      )
    }

    // Check if quiz has submissions (prevent editing if students have taken it)
    const submissions = await db.quizResult.count({
      where: { quizId },
    })

    if (submissions > 0) {
      return NextResponse.json(
        { error: 'Cannot edit quiz after students have submitted. Create a new quiz instead.' },
        { status: 400 }
      )
    }

    // Calculate total points if questions provided
    const totalPoints = questions
      ? questions.reduce((sum: number, q: any) => sum + (q.points || 1), 0)
      : existingQuiz.totalPoints

    // Update quiz
    const updatedQuiz = await db.quiz.update({
      where: { id: quizId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(instructions !== undefined && { instructions }),
        ...(questions && { questions: JSON.stringify(questions) }),
        ...(timeLimit !== undefined && { timeLimit }),
        ...(allowedAttempts !== undefined && { allowedAttempts }),
        ...(passingScore !== undefined && { passingScore }),
        ...(showResults !== undefined && { showResults }),
        ...(shuffleQuestions !== undefined && { shuffleQuestions }),
        ...(randomizeOptions !== undefined && { randomizeOptions }),
        ...(availableFrom !== undefined && { availableFrom: availableFrom ? new Date(availableFrom) : null }),
        ...(availableUntil !== undefined && { availableUntil: availableUntil ? new Date(availableUntil) : null }),
        ...(fullscreenMode !== undefined && { fullscreenMode }),
        ...(disableCopyPaste !== undefined && { disableCopyPaste }),
        ...(requireProctoring !== undefined && { requireProctoring }),
        ...(classIds && { classIds: classIds.join(',') }),
        ...(status && { status: status as QuizStatus }),
        ...(questions && { totalPoints }),
        updatedAt: new Date(),
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'QUIZ_UPDATED',
        userId: instructorUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Quiz',
        resourceId: quizId,
        details: JSON.stringify({ title }),
      },
    })

    return NextResponse.json({
      success: true,
      quiz: {
        ...updatedQuiz,
        questions: JSON.parse(updatedQuiz.questions),
      },
    })
  } catch (error) {
    console.error('=== Quiz Update Error ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'constructor' in error && error.constructor.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any
      console.error('Prisma error code:', prismaError.code)
      console.error('Prisma error meta:', prismaError.meta)
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quizId } = params

    // Fetch existing quiz
    const existingQuiz = await db.quiz.findUnique({
      where: { id: quizId },
    })

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if instructor created this quiz
    if (existingQuiz.createdById !== instructorUser.instructorId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this quiz' },
        { status: 403 }
      )
    }

    // Constraint: Can only delete if status is DRAFT
    if (existingQuiz.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Can only delete quizzes that are in DRAFT status' },
        { status: 400 }
      )
    }

    // Constraint: Can only delete if no students have taken it
    const submissions = await db.quizResult.count({
      where: { quizId },
    })

    if (submissions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete quiz after students have submitted. Archive instead.' },
        { status: 400 }
      )
    }

    // Delete quiz
    await db.quiz.delete({
      where: { id: quizId },
    })

    // Update quiz count in classes
    const classesToUpdate = existingQuiz.classIds.split(',')
    await db.class.updateMany({
      where: { id: { in: classesToUpdate } },
      data: { quizCount: { decrement: 1 } },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'QUIZ_DELETED',
        userId: instructorUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Quiz',
        resourceId: quizId,
        details: JSON.stringify({
          title: existingQuiz.title,
          status: existingQuiz.status,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
    })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
