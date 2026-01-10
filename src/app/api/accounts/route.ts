import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all accounts for the authenticated user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(accounts)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new account
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, type, monthlyIncome, currentBalance, startDate, totalLimit, availableLimit, billingCycleStart, dueDate } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Validate type-specific fields
    if (type === 'BANK_SALARY') {
      if (currentBalance === undefined) {
        return NextResponse.json(
          { error: 'Current balance is required for bank/salary accounts' },
          { status: 400 }
        )
      }
    } else if (type === 'CREDIT_CARD') {
      if (!totalLimit || availableLimit === undefined) {
        return NextResponse.json(
          { error: 'Total limit and available limit are required for credit card accounts' },
          { status: 400 }
        )
      }
    }

    const account = await prisma.account.create({
      data: {
        userId: session.user.id,
        name,
        type,
        monthlyIncome: monthlyIncome ? parseFloat(monthlyIncome) : null,
        currentBalance: currentBalance ? parseFloat(currentBalance) : 0,
        startDate: startDate ? new Date(startDate) : null,
        totalLimit: totalLimit ? parseFloat(totalLimit) : null,
        availableLimit: availableLimit !== undefined ? parseFloat(availableLimit) : null,
        billingCycleStart,
        dueDate,
      },
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
