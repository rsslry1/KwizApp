import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/security'
import { db } from '@/lib/db'

// GET student profile with class information
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const student = await db.student.findUnique({
      where: { userId: decoded.userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            isFirstLogin: true
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 })
    }

    // Fetch class information
    const classIds = student.classIds?.split(',').filter(Boolean) || []
    const classes = classIds.length > 0
      ? await db.class.findMany({
          where: { id: { in: classIds } },
          select: {
            id: true,
            name: true,
            description: true,
            section: true
          }
        })
      : []

    return NextResponse.json({
      student: {
        id: student.id,
        classIds: student.classIds,
        classes: classes,
        user: student.user
      }
    })
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

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

    const { fullName, username, email, phoneNumber } = await request.json()

    if (!username || !fullName) {
      return NextResponse.json({ message: 'Username and full name are required' }, { status: 400 })
    }

    // Get current student data
    const student = await db.student.findUnique({
      where: { userId: decoded.userId },
      include: { user: true }
    })

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 })
    }

    // Check username uniqueness if changed
    if (username !== student.user.username) {
      const existingUser = await db.user.findUnique({
        where: { username },
      })

      if (existingUser) {
        return NextResponse.json({ message: 'Username already exists' }, { status: 400 })
      }
    }

    // Update user profile (students cannot change full name after first login)
    const updateData: any = {
      username: username.trim(),
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
    }

    // Only allow full name update if it's still first login
    if (student.user.isFirstLogin) {
      updateData.fullName = fullName.trim()
    }

    const updatedUser = await db.user.update({
      where: { id: decoded.userId },
      data: updateData,
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
      message: 'Profile updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
