import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/security'
import { db } from '@/lib/db'

// GET instructors for student's classes
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Get student's class information
    const student = await db.student.findUnique({
      where: { userId: decoded.userId },
      select: { classIds: true }
    })

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 })
    }

    // Get class IDs
    const classIds = student.classIds?.split(',').filter(Boolean) || []
    
    if (classIds.length === 0) {
      return NextResponse.json({ instructors: [] })
    }

    // Find instructors assigned to these classes
    const instructors = await db.instructor.findMany({
      where: {
        OR: classIds.map(classId => ({
          classIds: { contains: classId }
        }))
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            avatar: true,
            role: true,
            status: true
          }
        }
      }
    })

    // Get class details for each instructor
    const instructorsWithClasses = await Promise.all(
      instructors.map(async (instructor) => {
        const instructorClassIds = instructor.classIds?.split(',').filter(Boolean) || []
        const commonClassIds = instructorClassIds.filter(id => classIds.includes(id))
        
        const classes = commonClassIds.length > 0
          ? await db.class.findMany({
              where: { id: { in: commonClassIds } },
              select: { id: true, name: true, description: true, section: true }
            })
          : []

        return {
          id: instructor.id,
          user: instructor.user,
          classes: classes
        }
      })
    )

    return NextResponse.json({
      instructors: instructorsWithClasses
    })
  } catch (error) {
    console.error('Error fetching student instructors:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
