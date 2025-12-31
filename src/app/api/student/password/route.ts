import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, hashPassword, verifyPassword } from '@/lib/auth/security'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Current password and new password are required' }, { status: 400 })
    }

    // Get current student data
    const student = await db.student.findUnique({
      where: { userId: decoded.userId },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, student.user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash the new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    await db.user.update({
      where: { id: decoded.userId },
      data: {
        password: hashedNewPassword
      }
    })

    return NextResponse.json({
      message: 'Password changed successfully'
    })
  } catch (error) {
    console.error('Error changing student password:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
