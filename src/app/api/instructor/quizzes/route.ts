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

  console.log('=== Instructor Access Debug ===')
  console.log('Payload:', payload)
  console.log('User ID:', payload.userId)

  // Get instructor with class assignments
  try {
    const instructor = await db.instructor.findUnique({
      where: { userId: payload.userId },
    })
    console.log('Found instructor:', instructor)
    
    if (!instructor) {
      console.log('Instructor not found for userId:', payload.userId)
      return null
    }

    const classIds = instructor.classIds?.split(',').filter(Boolean) || []
    console.log('Class IDs:', classIds)

    return { ...payload, classIds, instructorId: instructor.id }
  } catch (error) {
    console.error('Error finding instructor:', error)
    return null
  }
}

// GET all quizzes for instructor
export async function GET(request: NextRequest) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as QuizStatus | null

    const whereClause: any = {
      createdById: instructorUser.instructorId,
    }

    if (status) {
      whereClause.status = status
    }

    const quizzes = await db.quiz.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    // Parse questions for each quiz
    const quizzesWithParsedQuestions = quizzes.map(quiz => ({
      ...quiz,
      questions: JSON.parse(quiz.questions),
    }))

    return NextResponse.json({ quizzes: quizzesWithParsedQuestions })
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new quiz
export async function POST(request: NextRequest) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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
    } = await request.json()

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Parse questions if provided, default to empty array
    let parsedQuestions: any[] = []
    if (questions && Array.isArray(questions)) {
      parsedQuestions = questions
    }

    // Validate class IDs - must be assigned to instructor
    if (classIds && Array.isArray(classIds)) {
      const invalidClassIds = classIds.filter((id: string) => !instructorUser.classIds.includes(id))
      if (invalidClassIds.length > 0) {
        return NextResponse.json(
          { error: 'Cannot assign quiz to unassigned classes' },
          { status: 403 }
        )
      }
    }

    // Calculate total points
    const totalPoints = parsedQuestions.reduce((sum: number, q: any) => sum + (q.points || 1), 0)

    // Create quiz
    const quiz = await db.quiz.create({
      data: {
        title,
        description,
        instructions,
        questions: JSON.stringify(parsedQuestions),
        timeLimit,
        allowedAttempts,
        passingScore,
        showResults: showResults ?? true,
        shuffleQuestions: shuffleQuestions ?? false,
        randomizeOptions: randomizeOptions ?? false,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        fullscreenMode: fullscreenMode ?? false,
        disableCopyPaste: disableCopyPaste ?? false,
        requireProctoring: requireProctoring ?? false,
        classIds: classIds?.join(',') || instructorUser.classIds.join(','),
        createdById: instructorUser.instructorId,
        status: QuizStatus.DRAFT,
        totalPoints,
      },
    })

    // Update quiz count in assigned classes
    if (classIds && Array.isArray(classIds)) {
      await db.class.updateMany({
        where: { id: { in: classIds } },
        data: { quizCount: { increment: 1 } },
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'QUIZ_CREATED',
        userId: instructorUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Quiz',
        resourceId: quiz.id,
        details: JSON.stringify({ title, totalPoints }),
      },
    })

    return NextResponse.json({
      success: true,
      quiz: {
        ...quiz,
        questions: JSON.parse(quiz.questions),
      },
    })
  } catch (error) {
    console.error('Create quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
