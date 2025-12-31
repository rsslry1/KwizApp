import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/security'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'INSTRUCTOR') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Only JPEG, PNG, GIF, and WebP images are allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ message: 'Image size must be less than 5MB' }, { status: 400 })
    }

    // Get instructor data
    const instructor = await db.instructor.findUnique({
      where: { userId: decoded.userId },
      include: { user: true }
    })

    if (!instructor) {
      return NextResponse.json({ message: 'Instructor not found' }, { status: 404 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `instructor_${decoded.userId}_${timestamp}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update user avatar URL in database
    const avatarUrl = `/uploads/avatars/${filename}`
    await db.user.update({
      where: { id: decoded.userId },
      data: { avatar: avatarUrl }
    })

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarUrl
    })
  } catch (error) {
    console.error('Error uploading instructor avatar:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
