import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/security'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth/security'

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

    const { fullName, newPassword, email, phoneNumber } = await request.json()

    if (!fullName || !newPassword) {
      return NextResponse.json({ message: 'Full name and password are required' }, { status: 400 })
    }

    // Get current student data
    const student = await db.student.findUnique({
      where: { userId: decoded.userId },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 })
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: {
        fullName: fullName.trim(),
        password: hashedPassword,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        isFirstLogin: false
      },
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
      message: 'Profile completed successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error completing student profile:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
