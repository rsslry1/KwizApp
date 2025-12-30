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

// GET students for a specific class
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

    // Get students for this class
    const students = await db.student.findMany({
      where: {
        classIds: { contains: classId }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatar: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
            isFirstLogin: true
          }
        }
      },
      orderBy: {
        user: { fullName: 'asc' }
      }
    })

    // Get class info
    const classInfo = await db.class.findUnique({
      where: { id: classId },
      select: { name: true, section: true, description: true }
    })

    return NextResponse.json({
      class: classInfo,
      students: students.map(student => ({
        ...student,
        classIds: student.classIds?.split(',').filter(Boolean) || []
      }))
    })
  } catch (error) {
    console.error('Get class students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
