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

// POST submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const studentUser = await verifyStudentAccess(request)
    if (!studentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quizId, answers, startedAt } = await request.json()

    if (!quizId || !answers) {
      return NextResponse.json(
        { error: 'Quiz ID and answers are required' },
        { status: 400 }
      )
    }

    // Fetch quiz
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        createdBy: true,
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if quiz is published
    if (quiz.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Quiz is not available' },
        { status: 400 }
      )
    }

    // Check if student has access to this quiz (class-based isolation)
    const hasAccess = studentUser.classIds.some((classId: string) =>
      quiz.classIds.split(',').includes(classId)
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this quiz' },
        { status: 403 }
      )
    }

    // Check availability dates
    const now = new Date()
    if (quiz.availableFrom && now < quiz.availableFrom) {
      return NextResponse.json(
        { error: 'Quiz is not yet available' },
        { status: 400 }
      )
    }

    if (quiz.availableUntil && now > quiz.availableUntil) {
      return NextResponse.json(
        { error: 'Quiz has expired' },
        { status: 400 }
      )
    }

    // Check attempt limit
    const existingAttempts = await db.quizResult.count({
      where: {
        quizId,
        studentId: studentUser.studentId,
      },
    })

    if (quiz.allowedAttempts && existingAttempts >= quiz.allowedAttempts) {
      return NextResponse.json(
        { error: `You have reached the maximum number of attempts (${quiz.allowedAttempts})` },
        { status: 400 }
      )
    }

    // Parse quiz questions
    const questions = JSON.parse(quiz.questions)

    // Calculate score (auto-grade objective questions)
    let score = 0
    let maxScore = 0

    const gradedQuestions = questions.map((q: any) => {
      maxScore += q.points || 1

      const userAnswer = answers[q.id]
      let isCorrect = false

      switch (q.type) {
        case 'MULTIPLE_CHOICE':
        case 'TRUE_FALSE':
          isCorrect = userAnswer === q.correctAnswer
          break
        case 'SHORT_ANSWER':
        case 'FILL_IN_BLANK':
          isCorrect = userAnswer?.toString().toLowerCase().trim() === q.correctAnswer?.toString().toLowerCase().trim()
          break
        case 'ESSAY':
          // Essay questions need manual grading
          isCorrect = false
          break
      }

      if (isCorrect) {
        score += q.points || 1
      }

      return {
        questionId: q.id,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        points: q.points || 1,
        earnedPoints: isCorrect ? (q.points || 1) : 0,
        explanation: q.explanation,
      }
    })

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
    const passed = quiz.passingScore ? percentage >= quiz.passingScore : true

    // Calculate time spent
    const startedAtDate = startedAt ? new Date(startedAt) : now
    const completedAt = now
    const timeSpent = Math.floor((completedAt.getTime() - startedAtDate.getTime()) / 1000)

    // Check if submission is late
    const isLate = !!(quiz.availableUntil && completedAt > quiz.availableUntil)

    // Determine attempt number
    const attemptNumber = existingAttempts + 1

    // Create quiz result
    const result = await db.quizResult.create({
      data: {
        quiz: {
          connect: { id: quizId }
        },
        student: {
          connect: { id: studentUser.studentId }
        },
        score,
        maxScore,
        percentage,
        passed,
        answers: JSON.stringify({
          graded: gradedQuestions,
          raw: answers,
        }),
        startedAt: startedAtDate,
        completedAt,
        timeSpent,
        attemptNumber,
        isLate,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'QUIZ_SUBMITTED',
        userId: studentUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Quiz',
        resourceId: quizId,
        details: JSON.stringify({
          score,
          percentage,
          passed,
          timeSpent,
          attemptNumber,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        score,
        maxScore,
        percentage,
        passed,
        timeSpent,
        attemptNumber,
        isLate,
      },
    })
  } catch (error) {
    console.error('Submit quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
