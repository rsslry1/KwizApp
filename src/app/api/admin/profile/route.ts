import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/security'
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

    const { fullName, email, username } = await request.json()

    // Validate input
    if (!fullName || !username) {
      return NextResponse.json({ 
        message: 'Full name and username are required' 
      }, { status: 400 })
    }

    // Check if username is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        username,
        id: { not: decoded.userId }
      }
    })

    if (existingUser) {
      return NextResponse.json({ 
        message: 'Username is already taken' 
      }, { status: 400 })
    }

    // Check if email is already taken by another user (if email is provided)
    if (email) {
      const existingEmail = await db.user.findFirst({
        where: {
          email,
          id: { not: decoded.userId }
        }
      })

      if (existingEmail) {
        return NextResponse.json({ 
          message: 'Email is already taken' 
        }, { status: 400 })
      }
    }

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: {
        fullName,
        email,
        username,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        fullName: true,
        avatar: true,
        isFirstLogin: true,
        status: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
