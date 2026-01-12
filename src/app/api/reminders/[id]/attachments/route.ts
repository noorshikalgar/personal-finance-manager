import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'

/**
 * GET /api/reminders/[id]/attachments
 * Get all attachments for a reminder
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify reminder ownership
    const reminder = await prisma.reminder.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    })

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    return NextResponse.json(reminder.attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reminders/[id]/attachments
 * Upload a new attachment to a reminder
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify reminder ownership
    const reminder = await prisma.reminder.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF' },
        { status: 400 }
      )
    }

    // Validate file size (5MB for images, 10MB for PDFs)
    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Max size: ${maxSize / 1024 / 1024}MB for ${file.type}`,
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    let buffer = Buffer.from(bytes)

    // Optimize images using sharp (if image)
    if (file.type.startsWith('image/')) {
      try {
        const sharp = (await import('sharp')).default
        const optimized = await sharp(Buffer.from(buffer))
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()
        buffer = Buffer.from(optimized) as Buffer<ArrayBuffer>
      } catch (error) {
        console.error('Image optimization failed:', error)
        // Continue with original buffer if optimization fails
      }
    }

    // Upload to storage
    const storage = getStorage()
    const storageKey = await storage.upload(buffer, {
      fileName: file.name,
      fileType: file.type,
      fileSize: buffer.length,
    })

    // Save metadata to database
    const attachment = await prisma.reminderAttachment.create({
      data: {
        reminderId: id,
        fileName: file.name,
        fileType: file.type,
        fileSize: buffer.length,
        storageProvider: process.env.STORAGE_PROVIDER || 'local',
        storageKey,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
      { status: 500 }
    )
  }
}
