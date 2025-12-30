import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/security'

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

// PUT update class
export async function PUT(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { classId } = params
    const { name, section, description } = await request.json()

    // Fetch existing class
    const existingClass = await db.class.findUnique({
      where: { id: classId },
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if name already exists (if changing)
    if (name && name !== existingClass.name) {
      const duplicateClass = await db.class.findUnique({
        where: { name },
      })

      if (duplicateClass) {
        return NextResponse.json(
          { error: 'Class with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update class
    const updatedClass = await db.class.update({
      where: { id: classId },
      data: {
        ...(name && { name }),
        ...(section !== undefined && { section }),
        ...(description !== undefined && { description }),
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CLASS_UPDATED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Class',
        resourceId: classId,
        details: JSON.stringify({
          oldName: existingClass.name,
          newName: name || existingClass.name,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      class: updatedClass,
    })
  } catch (error) {
    console.error('Update class error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE class
export async function DELETE(
  request: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { classId } = params

    // Fetch existing class
    const existingClass = await db.class.findUnique({
      where: { id: classId },
    })

    if (!existingClass) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if class has students
    if (existingClass.studentCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete class with enrolled students. Reassign students first.' },
        { status: 400 }
      )
    }

    // Check if class has quizzes
    if (existingClass.quizCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete class with existing quizzes. Archive quizzes first.' },
        { status: 400 }
      )
    }

    // Delete class
    await db.class.delete({
      where: { id: classId },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CLASS_DELETED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Class',
        resourceId: classId,
        details: JSON.stringify({
          className: existingClass.name,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    })
  } catch (error) {
    console.error('Delete class error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
