import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/security'
import { writeFile } from 'fs/promises'
import path from 'path'

// Helper function to verify user access
async function verifyUserAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)

  if (!payload) {
    return null
  }

  return payload
}

// POST upload avatar
export async function POST(request: NextRequest) {
  try {
    const userPayload = await verifyUserAccess(request)
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `avatar-${userPayload.userId}-${timestamp}${ext}`

    // Save file to public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')

    // Create directory if it doesn't exist
    try {
      await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
    } catch (error) {
      // Directory might not exist, create it
      const fs = await import('fs')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
        await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
      } else {
        throw error
      }
    }

    const avatarUrl = `/uploads/avatars/${filename}`

    // Update user with avatar URL
    const updatedUser = await db.user.update({
      where: { id: userPayload.userId },
      data: { avatar: avatarUrl },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'USER_UPDATED',
        userId: userPayload.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'User',
        resourceId: userPayload.userId,
        details: JSON.stringify({ action: 'avatar_upload', filename }),
      },
    })

    return NextResponse.json({
      success: true,
      avatarUrl,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        fullName: updatedUser.fullName,
        avatar: updatedUser.avatar,
        isFirstLogin: updatedUser.isFirstLogin,
      },
    })
  } catch (error) {
    console.error('Upload avatar error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
