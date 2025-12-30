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

  // Get user info separately to avoid relation issues
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    }
  })

  return { ...payload, instructor, user }
}

// GET instructor profile
export async function GET(request: NextRequest) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get classes for this instructor
    const classIds = instructorUser.instructor.classIds?.split(',').filter(Boolean) || []
    const classes = classIds.length > 0
      ? await db.class.findMany({
          where: { id: { in: classIds } },
          select: { 
            id: true, 
            name: true, 
            studentCount: true, 
            quizCount: true,
            description: true,
            section: true
          }
        })
      : []

    return NextResponse.json({
      instructor: instructorUser.instructor,
      user: instructorUser.user,
      classes
    })
  } catch (error) {
    console.error('Get instructor profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
