import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/security'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth/security'
import { notifyAccountLocked } from '@/lib/notifications'

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

// PUT update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { studentId } = params
    const {
      username,
      fullName,
      email,
      phoneNumber,
      studentNumber,
      classIds,
      status,
      password,
    } = await request.json()

    // Fetch existing student
    const existingStudent = await db.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check username uniqueness if changed
    if (username && username !== existingStudent.user.username) {
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

    // Check student number uniqueness if changed
    if (studentNumber && studentNumber !== existingStudent.studentNumber) {
      const existingStudentNumber = await db.student.findUnique({
        where: { studentNumber },
      })

      if (existingStudentNumber) {
        return NextResponse.json(
          { error: 'Student number already exists' },
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
    const studentUpdateData: any = {}

    if (username) userUpdateData.username = username
    if (fullName) userUpdateData.fullName = fullName
    if (email !== undefined) userUpdateData.email = email
    if (phoneNumber !== undefined) userUpdateData.phoneNumber = phoneNumber
    if (status) userUpdateData.status = status
    if (password) userUpdateData.password = await hashPassword(password)

    if (studentNumber !== undefined) studentUpdateData.studentNumber = studentNumber
    if (classIds) studentUpdateData.classIds = classIds.join(',')

    // Update student and user
    const [updatedStudent] = await Promise.all([
      db.student.update({
        where: { id: studentId },
        data: studentUpdateData,
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
            where: { id: existingStudent.userId },
            data: userUpdateData,
          })
        : Promise.resolve()
    ])

    // Update student counts in classes if classIds changed
    if (classIds && Array.isArray(classIds)) {
      const oldClassIds = existingStudent.classIds?.split(',').filter(Boolean) || []
      const newClassIds = classIds

      const classesToAdd = newClassIds.filter(id => !oldClassIds.includes(id))
      const classesToRemove = oldClassIds.filter(id => !newClassIds.includes(id))

      if (classesToAdd.length > 0) {
        await db.class.updateMany({
          where: { id: { in: classesToAdd } },
          data: { studentCount: { increment: 1 } },
        })
      }

      if (classesToRemove.length > 0) {
        await db.class.updateMany({
          where: { id: { in: classesToRemove } },
          data: { studentCount: { decrement: 1 } },
        })
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Student',
        resourceId: studentId,
        details: JSON.stringify({
          username: username || existingStudent.user.username,
          fullName: fullName || existingStudent.user.fullName,
        }),
      },
    })

    // Create notification if status changed to LOCKED
    if (status && status === 'LOCKED' && existingStudent.user.status !== 'LOCKED') {
      try {
        await notifyAccountLocked(
          adminUser.userId,
          existingStudent.user.fullName || existingStudent.user.username,
          existingStudent.classIds || 'No class assigned',
          'Locked by administrator'
        )
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError)
        // Don't fail the whole operation if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      student: updatedStudent,
    })
  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { studentId } = params

    // Fetch existing student
    const existingStudent = await db.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if student has quiz results
    const quizResults = await db.quizResult.count({
      where: { studentId },
    })

    if (quizResults > 0) {
      return NextResponse.json(
        { error: 'Cannot delete student with existing quiz results. Archive instead.' },
        { status: 400 }
      )
    }

    const classIds = existingStudent.classIds?.split(',').filter(Boolean) || []

    // Delete student and user
    await Promise.all([
      db.student.delete({
        where: { id: studentId },
      }),
      db.user.delete({
        where: { id: existingStudent.userId },
      }),
      // Update student counts in classes
      classIds.length > 0
        ? db.class.updateMany({
            where: { id: { in: classIds } },
            data: { studentCount: { decrement: 1 } },
          })
        : Promise.resolve()
    ])

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'USER_DELETED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Student',
        resourceId: studentId,
        details: JSON.stringify({
          username: existingStudent.user.username,
          fullName: existingStudent.user.fullName,
          studentNumber: existingStudent.studentNumber,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully',
    })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
