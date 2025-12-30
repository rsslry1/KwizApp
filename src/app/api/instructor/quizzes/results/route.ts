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

  return payload
}

// GET all quiz results for instructor
export async function GET(request: NextRequest) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get instructor with class assignments
    const instructor = await db.instructor.findUnique({
      where: { userId: instructorUser.userId },
      select: { id: true, classIds: true }
    })

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    const classIds = instructor.classIds?.split(',').filter(Boolean) || []

    // Get all quizzes created by this instructor
    const quizzes = await db.quiz.findMany({
      where: { createdById: instructor.id },
      select: { id: true }
    })

    const quizIds = quizzes.map(q => q.id)

    // Get all results for instructor's quizzes
    const results = await db.quizResult.findMany({
      where: { 
        quizId: { in: quizIds }
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            }
          }
        },
        quiz: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    return NextResponse.json({
      results: results.map(result => ({
        id: result.id,
        quizId: result.quizId,
        studentId: result.studentId,
        student: result.student,
        quiz: result.quiz,
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
        passed: result.passed,
        timeSpent: result.timeSpent,
        attemptNumber: result.attemptNumber,
        isLate: result.isLate,
        completedAt: result.completedAt,
        startedAt: result.startedAt
      }))
    })
  } catch (error) {
    console.error('Get instructor quiz results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
