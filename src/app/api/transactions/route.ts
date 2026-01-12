import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET transactions with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const accountId = searchParams.get('accountId')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const type = searchParams.get('type')
    const exportCSV = searchParams.get('export') === 'true'

    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
    }

    if (accountId) where.accountId = accountId
    
    // Handle "no category" filter
    if (categoryId === 'none') {
      where.categoryId = null
    } else if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (type) where.type = type
    
    if (search) {
      where.OR = [
        { note: { contains: search, mode: 'insensitive' } },
        { account: { name: { contains: search, mode: 'insensitive' } } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ]
      
      // Also try to match amount - check if the search string appears in the stringified amount
      const searchNum = search.replace(/^-/, '') // Remove leading minus for comparison
      if (!isNaN(Number(searchNum))) {
        where.OR.push({
          amount: {
            in: [Number(search), -Number(searchNum)],
          },
        })
      }
    }
    
    if (fromDate || toDate) {
      where.date = {}
      if (fromDate) {
        const startOfDay = new Date(fromDate)
        startOfDay.setHours(0, 0, 0, 0)
        where.date.gte = startOfDay
      }
      if (toDate) {
        const endOfDay = new Date(toDate)
        endOfDay.setHours(23, 59, 59, 999)
        where.date.lte = endOfDay
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: { name: true, type: true },
        },
        category: {
          select: { name: true, color: true },
        },
      },
      orderBy: { date: 'desc' },
      skip: exportCSV ? 0 : skip,
      take: exportCSV ? 10000 : limit,
    })

    if (exportCSV) {
      // Generate CSV
      const headers = ['Date', 'Amount', 'Type', 'Account', 'Category', 'Note']
      const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString('en-US'),
        Number(t.amount).toFixed(2),
        t.type,
        t.account.name,
        t.category?.name || 'No Category',
        t.note || '',
      ])
      
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    const total = await prisma.transaction.count({ where })

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new transaction
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const body = await req.json()
    const { accountId, categoryId, reminderId, date, amount, type, note } = body

    if (!accountId || !date || amount === undefined || !type) {
      return NextResponse.json(
        { error: 'Account, date, amount, and type are required' },
        { status: 400 }
      )
    }

    // Verify account ownership
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Start a transaction to update both transaction and account balance
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId,
          categoryId: categoryId || null,
          reminderId: reminderId || null,
          date: new Date(date),
          amount: parseFloat(amount),
          type,
          note,
        },
        include: {
          account: {
            select: { name: true },
          },
          category: {
            select: { name: true, color: true },
          },
        },
      })

      // Update account balance
      const amountValue = parseFloat(amount)
      
      if (account.type === 'BANK_SALARY') {
        // For bank accounts: add to balance
        await tx.account.update({
          where: { id: accountId },
          data: {
            currentBalance: {
              increment: amountValue,
            },
          },
        })
      } else if (account.type === 'CREDIT_CARD') {
        // For credit cards: adjust available limit
        // Expenses (negative) reduce available limit
        // Payments (positive) increase available limit
        await tx.account.update({
          where: { id: accountId },
          data: {
            availableLimit: {
              increment: amountValue,
            },
          },
        })
      }

      return transaction
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
