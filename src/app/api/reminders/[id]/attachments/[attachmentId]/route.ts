import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStorage } from '@/lib/storage'

/**
 * GET /api/reminders/[id]/attachments/[attachmentId]
 * Download an attachment file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attachmentId } = await params

    // Verify attachment belongs to user's reminder
    const attachment = await prisma.reminderAttachment.findUnique({
      where: {
        id: attachmentId,
      },
      include: {
        reminder: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!attachment || attachment.reminder.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    // Download file from storage
    const storage = getStorage()
    const fileBuffer = await storage.download(attachment.storageKey)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': attachment.fileType,
        'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json(
      { error: 'Failed to download attachment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reminders/[id]/attachments/[attachmentId]
 * Delete an attachment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attachmentId } = await params

    // Verify attachment belongs to user's reminder
    const attachment = await prisma.reminderAttachment.findUnique({
      where: {
        id: attachmentId,
      },
      include: {
        reminder: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!attachment || attachment.reminder.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    // Delete file from storage
    const storage = getStorage()
    try {
      await storage.delete(attachment.storageKey)
    } catch (error) {
      console.error('Failed to delete file from storage:', error)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.reminderAttachment.delete({
      where: { id: attachmentId },
    })

    return NextResponse.json({ message: 'Attachment deleted successfully' })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}
