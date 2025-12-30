import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, hashPassword } from '@/lib/auth/security'

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

// PUT update instructor
export async function PUT(
  request: NextRequest,
  { params }: { params: { instructorId: string } }
) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { instructorId } = params
    const {
      username,
      fullName,
      email,
      phoneNumber,
      classIds,
      status,
      password,
    } = await request.json()

    // Fetch existing instructor
    const existingInstructor = await db.instructor.findUnique({
      where: { id: instructorId },
      include: { user: true }
    })

    if (!existingInstructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    // Check username uniqueness if changed
    if (username && username !== existingInstructor.user.username) {
      const existingUser = await db.user.findUnique({
        where: { username },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        )
      }
    }

    // Validate classes if provided
    if (classIds && Array.isArray(classIds)) {
      const classes = await db.class.findMany({
        where: { id: { in: classIds } },
      })

      if (classes.length !== classIds.length) {
        return NextResponse.json(
          { error: 'One or more classes not found' },
          { status: 404 }
        )
      }
    }

    // Prepare update data
    const userUpdateData: any = {}
    const instructorUpdateData: any = {}

    if (username) userUpdateData.username = username
    if (fullName) userUpdateData.fullName = fullName
    if (email !== undefined) userUpdateData.email = email
    if (phoneNumber !== undefined) userUpdateData.phoneNumber = phoneNumber
    if (status) userUpdateData.status = status
    if (password) userUpdateData.password = await hashPassword(password)

    if (classIds) instructorUpdateData.classIds = classIds.join(',')

    // Update instructor and user
    const [updatedInstructor] = await Promise.all([
      db.instructor.update({
        where: { id: instructorId },
        data: instructorUpdateData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              role: true,
              status: true,
              createdAt: true,
              lastLoginAt: true,
              isFirstLogin: true,
            }
          }
        }
      }),
      Object.keys(userUpdateData).length > 0
        ? db.user.update({
            where: { id: existingInstructor.userId },
            data: userUpdateData,
          })
        : Promise.resolve()
    ])

    // Update instructor assignments in classes if classIds changed
    if (classIds && Array.isArray(classIds)) {
      const oldClassIds = existingInstructor.classIds?.split(',').filter(Boolean) || []
      const newClassIds = classIds

      const classesToAdd = newClassIds.filter(id => !oldClassIds.includes(id))
      const classesToRemove = oldClassIds.filter(id => !newClassIds.includes(id))

      // Fetch current class data
      const currentClasses = await db.class.findMany({
        where: { id: { in: [...classesToAdd, ...classesToRemove] } },
        select: { id: true, instructorIds: true }
      })

      // Add instructor to new classes
      if (classesToAdd.length > 0) {
        await Promise.all(
          classesToAdd.map(classId =>
            db.class.update({
              where: { id: classId },
              data: {
                instructorIds: {
                  set: Array.from(new Set([
                    ...(currentClasses.find(c => c.id === classId)?.instructorIds?.split(',').filter(Boolean) || []),
                    instructorId
                  ])).join(',')
                }
              }
            })
          )
        )
      }

      // Remove instructor from old classes
      if (classesToRemove.length > 0) {
        await Promise.all(
          classesToRemove.map(classId =>
            db.class.update({
              where: { id: classId },
              data: {
                instructorIds: {
                  set: currentClasses.find(c => c.id === classId)?.instructorIds?.split(',')
                    .filter(Boolean)
                    .filter(id => id !== instructorId)
                    .join(',') || ''
                }
              }
            })
          )
        )
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Instructor',
        resourceId: instructorId,
        details: JSON.stringify({
          username: username || existingInstructor.user.username,
          fullName: fullName || existingInstructor.user.fullName,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      instructor: updatedInstructor,
    })
  } catch (error) {
    console.error('Update instructor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE instructor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { instructorId: string } }
) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { instructorId } = params

    // Fetch existing instructor
    const existingInstructor = await db.instructor.findUnique({
      where: { id: instructorId },
      include: { user: true }
    })

    if (!existingInstructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    // Check if instructor has quizzes
    const quizzes = await db.quiz.count({
      where: { createdById: instructorId },
    })

    if (quizzes > 0) {
      return NextResponse.json(
        { error: 'Cannot delete instructor with existing quizzes. Archive instead.' },
        { status: 400 }
      )
    }

    const classIds = existingInstructor.classIds?.split(',').filter(Boolean) || []

    // Delete instructor and user
    await Promise.all([
      db.instructor.delete({
        where: { id: instructorId },
      }),
      db.user.delete({
        where: { id: existingInstructor.userId },
      }),
      // Remove instructor from classes
      classIds.length > 0
        ? Promise.all(
            classIds.map(async (classId) => {
              const classData = await db.class.findUnique({
                where: { id: classId },
                select: { instructorIds: true }
              })
              
              return db.class.update({
                where: { id: classId },
                data: {
                  instructorIds: {
                    set: classData?.instructorIds?.split(',')
                      .filter(Boolean)
                      .filter(id => id !== instructorId)
                      .join(',') || ''
                  }
                }
              })
            })
          )
        : Promise.resolve()
    ])

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'USER_DELETED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Instructor',
        resourceId: instructorId,
        details: JSON.stringify({
          username: existingInstructor.user.username,
          fullName: existingInstructor.user.fullName,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Instructor deleted successfully',
    })
  } catch (error) {
    console.error('Delete instructor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
