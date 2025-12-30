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

// GET quizzes for a specific class
export async function GET(request: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { classId } = params

    // Verify instructor has access to this class
    const instructor = await db.instructor.findUnique({
      where: { userId: instructorUser.userId },
      select: { classIds: true }
    })

    if (!instructor || !instructor.classIds?.split(',').includes(classId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get quizzes for this class
    const quizzes = await db.quiz.findMany({
      where: {
        classIds: { contains: classId },
        createdById: instructorUser.userId
      },
      include: {
        _count: {
          select: { quizResults: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get class info
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      select: { name: true, section: true, description: true }
    })

    return NextResponse.json({
      class: classInfo,
      quizzes
    })
  } catch (error) {
    console.error('Get class quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
