import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/security'

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

// GET quiz results for instructor (all students in their classes)
export async function GET(
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

    // Check if instructor created this quiz or has access to its classes
    const hasAccess =
      quiz.createdById === instructorUser.instructorId ||
      quiz.classIds.split(',').some((classId: string) =>
        instructorUser.classIds.includes(classId)
      )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this quiz' },
        { status: 403 }
      )
    }

    // Get all results for this quiz
    const results = await db.quizResult.findMany({
      where: { quizId },
      orderBy: [
        { percentage: 'desc' },
        { completedAt: 'desc' },
      ],
    })

    if (results.length === 0) {
      return NextResponse.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
        },
        results: [],
        stats: {
          totalSubmissions: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passRate: 0,
        },
      })
    }

    // Parse results and get student info
    const resultsWithStudents = await Promise.all(
      results.map(async (result) => {
        const student = await db.student.findUnique({
          where: { id: result.studentId },
          include: { 
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true
              }
            }
          },
        })

        return {
          id: result.id,
          studentId: result.studentId,
          studentName: student?.user?.fullName || student?.user?.username || 'Unknown',
          studentNumber: student?.studentNumber,
          studentAvatar: student?.user?.avatar,
          score: result.score,
          maxScore: result.maxScore,
          percentage: result.percentage,
          passed: result.passed,
          timeSpent: result.timeSpent,
          attemptNumber: result.attemptNumber,
          isLate: result.isLate,
          completedAt: result.completedAt,
        }
      })
    )

    // Calculate statistics
    const totalSubmissions = results.length
    const averageScore =
      results.reduce((sum, r) => sum + r.percentage, 0) / totalSubmissions
    const highestScore = Math.max(...results.map((r) => r.percentage))
    const lowestScore = Math.min(...results.map((r) => r.percentage))
    const passRate =
      (results.filter((r) => r.passed).length / totalSubmissions) * 100

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore,
      },
      results: resultsWithStudents,
      stats: {
        totalSubmissions,
        averageScore: Math.round(averageScore * 10) / 10,
        highestScore: Math.round(highestScore * 10) / 10,
        lowestScore: Math.round(lowestScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
      },
    })
  } catch (error) {
    console.error('Get instructor quiz results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
