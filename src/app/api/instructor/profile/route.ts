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

// PUT instructor profile
export async function PUT(request: NextRequest) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { fullName, username, email, phoneNumber } = await request.json()

    if (!username || !fullName) {
      return NextResponse.json({ error: 'Username and full name are required' }, { status: 400 })
    }

    // Check username uniqueness if changed
    if (username !== instructorUser.user?.username) {
      const existingUser = await db.user.findUnique({
        where: { username },
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }
    }

    // Update user profile
    const updateData: any = {
      username: username.trim(),
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      fullName: fullName.trim(), // Instructors can change full name
    }

    const updatedUser = await db.user.update({
      where: { id: instructorUser.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        avatar: true,
        isFirstLogin: true
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Update instructor profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
