import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword, validatePasswordStrength, validateFullName } from '@/lib/auth/security'

export async function POST(request: NextRequest) {
  try {
    const { userId, fullName, newPassword, confirmPassword, email } = await request.json()

    // Validate input
    if (!userId || !fullName || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Verify user exists and is a student
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { student: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Profile setup is only for students' },
        { status: 400 }
      )
    }

    if (!user.isFirstLogin) {
      return NextResponse.json(
        { error: 'Profile has already been set up' },
        { status: 400 }
      )
    }

    // Validate full name format
    if (!validateFullName(fullName)) {
      return NextResponse.json(
        { error: 'Full name must be in "First Last" format with no special characters' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join('. ') },
        { status: 400 }
      )
    }

    // Verify passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Get current password history
    const passwordHistory = user.student?.passwordHistory || '[]'
    const history = JSON.parse(passwordHistory)

    // Add current password to history (max 5)
    history.unshift(user.password)
    const newHistory = JSON.stringify(history.slice(0, 5))

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        fullName,
        password: hashedPassword,
        email: email || undefined,
        isFirstLogin: false,
      },
      include: {
        student: true,
      },
    })

    // Update password history
    await db.student.update({
      where: { userId },
      data: {
        passwordHistory: newHistory,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGE',
        userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: JSON.stringify({ reason: 'First login setup' }),
      },
    })

    // Get class IDs
    const classIds = updatedUser.student?.classIds?.split(',').filter(Boolean) || []

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
        avatar: updatedUser.avatar,
        isFirstLogin: updatedUser.isFirstLogin,
        classIds,
      },
    })
  } catch (error) {
    console.error('Profile setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
