import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all recurring transactions
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: { userId: session.user.id },
      include: {
        account: {
          select: { name: true, type: true },
        },
        category: {
          select: { name: true, color: true },
        },
      },
      orderBy: { dayOfMonth: 'asc' },
    })

    return NextResponse.json(recurringTransactions)
  } catch (error) {
    console.error('Error fetching recurring transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new recurring transaction
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { accountId, categoryId, amount, type, note, dayOfMonth, startDate, endDate } = body

    if (!accountId || amount === undefined || !type || !dayOfMonth) {
      return NextResponse.json(
        { error: 'Account, amount, type, and day of month are required' },
        { status: 400 }
      )
    }

    if (dayOfMonth < 1 || dayOfMonth > 31) {
      return NextResponse.json(
        { error: 'Day of month must be between 1 and 31' },
        { status: 400 }
      )
    }

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        userId: session.user.id,
        accountId,
        categoryId: categoryId || null,
        amount: parseFloat(amount),
        type,
        note,
        dayOfMonth: parseInt(dayOfMonth),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        account: {
          select: { name: true },
        },
        category: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json(recurringTransaction, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
