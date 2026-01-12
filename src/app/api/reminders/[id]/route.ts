import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReminderCycle, ReminderStatus } from '@prisma/client'

/**
 * GET /api/reminders/[id]
 * Fetch a single reminder with full details
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

    const reminder = await prisma.reminder.findUnique({
      where: {
        id,
        userId: session.user.id, // Ensure ownership
      },
      include: {
        category: true,
        transactions: {
          orderBy: { date: 'desc' },
          include: {
            category: true,
          },
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        _count: {
          select: {
            transactions: true,
            attachments: true,
          },
        },
      },
    })

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error fetching reminder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reminders/[id]
 * Update a reminder
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.reminder.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      cycle,
      customCycleDays,
      nextDate,
      isExpense,
      estimatedAmount,
      categoryId,
      status,
      lastDate,
    } = body

    // Validation
    if (cycle === 'CUSTOM' && customCycleDays === undefined) {
      return NextResponse.json(
        { error: 'customCycleDays required when cycle is CUSTOM' },
        { status: 400 }
      )
    }

    if (isExpense && !estimatedAmount && estimatedAmount !== 0) {
      return NextResponse.json(
        { error: 'estimatedAmount required when isExpense is true' },
        { status: 400 }
      )
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(cycle !== undefined && { cycle: cycle as ReminderCycle }),
        ...(customCycleDays !== undefined && { customCycleDays }),
        ...(nextDate !== undefined && { nextDate: new Date(nextDate) }),
        ...(isExpense !== undefined && { isExpenseRelated: isExpense }),
        ...(estimatedAmount !== undefined && { estimatedCost: estimatedAmount ? parseFloat(estimatedAmount) : null }),
        ...(categoryId !== undefined && { categoryId }),
        ...(status !== undefined && { status: status as ReminderStatus }),
        ...(lastDate !== undefined && {
          lastDate: lastDate ? new Date(lastDate) : null,
        }),
      },
      include: {
        category: true,
        _count: {
          select: {
            transactions: true,
            attachments: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reminders/[id]
 * Delete a reminder (cascade deletes attachments and unlinks transactions)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.reminder.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        attachments: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    // Delete physical files from storage
    const { getStorage } = await import('@/lib/storage')
    const storage = getStorage()
    
    for (const attachment of existing.attachments) {
      try {
        await storage.delete(attachment.storageKey)
      } catch (error) {
        console.error(`Failed to delete file ${attachment.storageKey}:`, error)
        // Continue deleting other files
      }
    }

    // Delete reminder from database (cascade deletes attachments, unlinks transactions)
    await prisma.reminder.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Reminder deleted successfully' })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    )
  }
}
