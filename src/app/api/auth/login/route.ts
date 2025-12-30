import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth/security'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username (role will be auto-detected)
    const user = await db.user.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check account status
    if (user.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Account is locked. Please contact administrator.' },
        { status: 403 }
      )
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Account is suspended. Please contact administrator.' },
        { status: 403 }
      )
    }

    if (user.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedLogins = user.failedLogins + 1
      const updateData: any = {
        failedLogins,
      }

      // Lock account after 5 failed attempts
      if (failedLogins >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        updateData.status = 'LOCKED'
      }

      await db.user.update({
        where: { id: user.id },
        data: updateData,
      })

      // Create audit log
      await db.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          userId: user.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Reset failed login attempts on successful login
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLogins: 0,
        lastLoginAt: new Date(),
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        userId: user.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    })

    // Get class IDs
    let classIds: string[] = []
    if (user.role === 'STUDENT' && user.student?.classIds) {
      classIds = user.student.classIds.split(',').filter(Boolean)
    } else if (user.role === 'INSTRUCTOR' && user.instructor?.classIds) {
      classIds = user.instructor.classIds.split(',').filter(Boolean)
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      role: user.role,
      username: user.username,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        avatar: user.avatar,
        isFirstLogin: user.isFirstLogin,
        classIds,
      },
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
