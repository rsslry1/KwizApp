import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/security'

// Helper function to verify student access
async function verifyStudentAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)

  if (!payload || payload.role !== 'STUDENT') {
    return null
  }

  // Get student with class assignments
  const student = await db.student.findUnique({
    where: { userId: payload.userId },
  })

  if (!student) {
    return null
  }

  const classIds = student.classIds?.split(',').filter(Boolean) || []

  return { ...payload, classIds, studentId: student.id }
}

// GET quiz results for a student
export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const studentUser = await verifyStudentAccess(request)
    if (!studentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quizId } = params

    // Fetch quiz
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if student has access to this quiz
    const hasAccess = studentUser.classIds.some((classId: string) =>
      quiz.classIds.split(',').includes(classId)
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this quiz' },
        { status: 403 }
      )
    }

    // Get all results for this student for this quiz
    const results = await db.quizResult.findMany({
      where: {
        quizId,
        studentId: studentUser.studentId,
      },
      orderBy: { attemptNumber: 'asc' },
    })

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No results found for this quiz' },
        { status: 404 }
      )
    }

    // Parse and format results
    const formattedResults = results.map((result) => ({
      id: result.id,
      score: result.score,
      maxScore: result.maxScore,
      percentage: result.percentage,
      passed: result.passed,
      timeSpent: result.timeSpent,
      attemptNumber: result.attemptNumber,
      isLate: result.isLate,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
      feedback: result.feedback,
      instructorNotes: result.instructorNotes,
      answers: JSON.parse(result.answers),
    }))

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        showResults: quiz.showResults,
      },
      results: formattedResults,
    })
  } catch (error) {
    console.error('Get quiz results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
