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
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { currentPassword, newPassword } = await request.json()

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        message: 'Current password and new password are required' 
      }, { status: 400 })
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json({ 
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors 
      }, { status: 400 })
    }

    // Get current user with password
    const currentUser = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { password: true }
    })

    if (!currentUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, currentUser.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        message: 'Current password is incorrect' 
      }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    await db.user.update({
      where: { id: decoded.userId },
      data: { 
        password: hashedNewPassword,
        isFirstLogin: false 
      }
    })

    return NextResponse.json({ 
      message: 'Password changed successfully' 
    })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
