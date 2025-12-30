import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, hashPassword, generateDefaultPassword } from '@/lib/auth/security'

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

// POST bulk generate instructor accounts
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { count, classIds } = await request.json()

    if (!count || count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 50' },
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
    const generatedInstructors = []
    const classIdString = classIds.join(',')

    // Find highest existing instructor number
    const lastInstructor = await db.instructor.findFirst({
      orderBy: { id: 'desc' },
    })

    let startIndex = 1
    if (lastInstructor) {
      // Extract number from username pattern "instructorX"
      const match = lastInstructor.id.match(/\d+$/)
      if (match) {
        startIndex = parseInt(match[0]) + 1
      }
    }

    // Generate instructors
    for (let i = 0; i < count; i++) {
      const username = `instructor${startIndex + i}`

      // Create user
      const user = await db.user.create({
        data: {
          username,
          password: hashedPassword,
          role: 'INSTRUCTOR',
          status: 'ACTIVE',
          fullName: `Instructor ${startIndex + i}`,
          isFirstLogin: true,
          mfaEnabled: false,
          failedLogins: 0,
        },
      })

      // Create instructor
      const instructor = await db.instructor.create({
        data: {
          userId: user.id,
          classIds: classIdString,
        },
      })

      generatedInstructors.push({
        id: instructor.id,
        username,
        fullName: `Instructor ${startIndex + i}`,
        defaultPassword: generateDefaultPassword(),
        classIds,
      })

      // Update instructor count in classes
      await db.class.updateMany({
        where: { id: { in: classIds } },
        data: {
          instructorIds: {
            set: Array.from(new Set([
              ...classIds.flatMap((id) =>
                classes
                  .find((c) => c.id === id)
                  ?.instructorIds.split(',')
                  .filter(Boolean) || []
              ),
              instructor.id,
            ])).join(','),
          },
        },
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          action: 'USER_CREATED',
          userId: adminUser.userId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resourceType: 'Instructor',
          resourceId: instructor.id,
          details: JSON.stringify({
            username,
            classIds,
          }),
        },
      })
    }

    return NextResponse.json({
      success: true,
      count: generatedInstructors.length,
      instructors: generatedInstructors,
    })
  } catch (error) {
    console.error('Generate instructors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
