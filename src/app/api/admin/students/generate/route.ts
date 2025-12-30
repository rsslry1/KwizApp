import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, hashPassword, generateUsername, generateDefaultPassword } from '@/lib/auth/security'

// Helper function to verify admin access
async function verifyAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)

  if (!payload || payload.role !== 'ADMIN') {
    return null
  }

  return payload
}

// POST bulk generate student accounts
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { count, classIds, studentNumberPrefix } = await request.json()

    if (!count || count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one class must be specified' },
        { status: 400 }
      )
    }

    // Validate classes exist
    const classes = await db.class.findMany({
      where: { id: { in: classIds } },
    })

    if (classes.length !== classIds.length) {
      return NextResponse.json(
        { error: 'One or more classes not found' },
        { status: 404 }
      )
    }

    const hashedPassword = await hashPassword(generateDefaultPassword())
    const generatedStudents = []
    const classIdString = classIds.join(',')

    // Find the highest existing student number
    const lastStudent = await db.student.findFirst({
      orderBy: { studentNumber: 'desc' },
    })

    let startIndex = 1
    if (lastStudent?.studentNumber) {
      const match = lastStudent.studentNumber.match(/\d+$/)
      if (match) {
        startIndex = parseInt(match[0]) + 1
      }
    }

    // Generate students
    for (let i = 0; i < count; i++) {
      const studentNumber = `${studentNumberPrefix || 'STU'}${String(startIndex + i).padStart(4, '0')}`
      const username = generateUsername(startIndex + i)

      // Create user
      const user = await db.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'STUDENT',
          status: 'ACTIVE',
          isFirstLogin: true,
          failedLogins: 0,
        },
      })

      // Create student
      const student = await db.student.create({
        data: {
          userId: user.id,
          classIds: classIdString,
          studentNumber,
          passwordHistory: JSON.stringify([]),
        },
      })

      generatedStudents.push({
        id: student.id,
        username,
        studentNumber,
        defaultPassword: generateDefaultPassword(),
        classIds,
      })

      // Update student count in classes
      await db.class.updateMany({
        where: { id: { in: classIds } },
        data: { studentCount: { increment: 1 } },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          action: 'USER_CREATED',
          userId: adminUser.userId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resourceType: 'Student',
          resourceId: student.id,
          details: JSON.stringify({
            username,
            studentNumber,
            classIds,
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      count: generatedStudents.length,
      students: generatedStudents,
    })
  } catch (error) {
    console.error('Generate students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
