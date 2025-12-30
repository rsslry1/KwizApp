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

// GET all available quizzes for student (filtered by their classes)
export async function GET(request: NextRequest) {
  try {
    const studentUser = await verifyStudentAccess(request)
    if (!studentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'available', 'completed', 'upcoming'

    const now = new Date()

    // Build where clause based on student's classes and quiz status
    const whereClause: any = {
      status: 'PUBLISHED',
      OR: studentUser.classIds.map((classId: string) => ({
        classIds: { contains: classId },
      })),
    }

    // Add date filters based on requested status
    if (status === 'available') {
      whereClause.AND = [
        { availableFrom: { lte: now } },
        {
          OR: [
            { availableUntil: { gte: now } },
            { availableUntil: { isNull: true } },
          ],
        },
      ]
    } else if (status === 'upcoming') {
      whereClause.availableFrom = { gt: now }
    }

    // Get quizzes
    const quizzes = await db.quiz.findMany({
      where: whereClause,
      orderBy: { availableFrom: 'asc' },
    })

    // Get completed quiz results
    const completedQuizIds = await db.quizResult.findMany({
      where: { studentId: studentUser.studentId },
      select: { quizId: true },
    })

    const completedIds = new Set(completedQuizIds.map(r => r.quizId))

    // Parse questions and add completion status
    const quizzesWithStatus = quizzes.map(quiz => ({
      ...quiz,
      questions: JSON.parse(quiz.questions),
      isCompleted: completedIds.has(quiz.id),
    }))

    return NextResponse.json({ quizzes: quizzesWithStatus })
  } catch (error) {
    console.error('Get student quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
