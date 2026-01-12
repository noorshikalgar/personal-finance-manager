import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ReminderCycle, ReminderStatus } from '@prisma/client'

/**
 * GET /api/reminders
 * Fetch all reminders for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ReminderStatus | null
    const includeCompleted = searchParams.get('includeCompleted') === 'true'

    const reminders = await prisma.reminder.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status }),
        ...(!includeCompleted && { status: { not: 'COMPLETED' } }),
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
      orderBy: [
        { status: 'asc' }, // OVERDUE first, then UPCOMING
        { nextDate: 'asc' },
      ],
    })

    return NextResponse.json(reminders)
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reminders
 * Create a new reminder
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    } = body

    // Validation
    if (!title || !cycle || !nextDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, cycle, nextDate' },
        { status: 400 }
      )
    }

    if (cycle === 'CUSTOM' && !customCycleDays) {
      return NextResponse.json(
        { error: 'customCycleDays required when cycle is CUSTOM' },
        { status: 400 }
      )
    }

    if (isExpense && !estimatedAmount) {
      return NextResponse.json(
        { error: 'estimatedAmount required when isExpense is true' },
        { status: 400 }
      )
    }

    const reminder = await prisma.reminder.create({
      data: {
        title,
        description,
        cycle: cycle as ReminderCycle,
        customCycleDays: customCycleDays || null,
        nextDate: new Date(nextDate),
        isExpenseRelated: isExpense || false,
        estimatedCost: estimatedAmount ? parseFloat(estimatedAmount) : null,
        categoryId: categoryId || null,
        userId: session.user.id,
        status: 'UPCOMING',
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

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    )
  }
}
