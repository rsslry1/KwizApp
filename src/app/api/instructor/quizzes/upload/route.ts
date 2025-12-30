import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/security'
import { writeFile } from 'fs/promises'
import path from 'path'

// Helper function to verify instructor access
async function verifyInstructorAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)

  if (!payload || payload.role !== 'INSTRUCTOR') {
    return null
  }

  return payload
}

// POST upload quiz image
export async function POST(request: NextRequest) {
  try {
    const instructorUser = await verifyInstructorAccess(request)
    if (!instructorUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

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

    // Validate file size (max 10MB for quiz images)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = path.extname(file.name)
    const filename = `quiz-${timestamp}${ext}`

    // Save file to public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'quizzes')

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

    const imageUrl = `/uploads/quizzes/${filename}`

    return NextResponse.json({
      success: true,
      imageUrl,
      filename,
    })
  } catch (error) {
    console.error('Upload quiz image error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
