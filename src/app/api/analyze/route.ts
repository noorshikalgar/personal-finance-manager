import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const accountIds = searchParams.getAll('accountIds')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const where: any = {
      userId: session.user.id,
    }

    if (accountIds && accountIds.length > 0) {
      where.accountId = { in: accountIds }
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
        account: { select: { name: true, type: true } },
        category: { select: { name: true, color: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Fetch all categories with budgets for this user
    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
    })

    // Create a budget map
    const budgetMap: Record<string, number> = {}
    categories.forEach((cat) => {
      budgetMap[cat.name] = cat.monthlyBudget ? Number(cat.monthlyBudget) : 0
    })

    // Calculate analytics
    let totalIncome = 0
    let totalExpense = 0
    const byCategory: Record<string, { amount: number; color?: string; count: number; budget: number }> = {}
    const byAccount: Record<string, { income: number; expense: number; name: string }> = {}

    transactions.forEach((t) => {
      const amount = Number(t.amount)

      if (t.type === 'INCOME') {
        totalIncome += amount
      } else {
        totalExpense += Math.abs(amount)
      }

      // By category
      const categoryName = t.category?.name || 'Uncategorized'
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = {
          amount: 0,
          color: t.category?.color || undefined,
          count: 0,
          budget: budgetMap[categoryName] || 0,
        }
      }
      byCategory[categoryName].amount += Math.abs(amount)
      byCategory[categoryName].count += 1

      // By account
      if (!byAccount[t.accountId]) {
        byAccount[t.accountId] = {
          income: 0,
          expense: 0,
          name: t.account.name,
        }
      }
      if (t.type === 'INCOME') {
        byAccount[t.accountId].income += amount
      } else {
        byAccount[t.accountId].expense += Math.abs(amount)
      }
    })

    const saved = totalIncome - totalExpense

    // Sort categories by amount
    const sortedCategories = Object.entries(byCategory)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)

    // Get top 5 categories
    const topCategories = sortedCategories.slice(0, 5)

    // Calculate previous month comparison
    const now = new Date()
    const currentDate = new Date(fromDate || now)
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0)

    const previousMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
        ...(accountIds && accountIds.length > 0 && { accountId: { in: accountIds } }),
      },
    })

    let previousMonthExpense = 0
    previousMonthTransactions.forEach((t) => {
      if (t.type !== 'INCOME') {
        previousMonthExpense += Math.abs(Number(t.amount))
      }
    })

    const expenseChange = previousMonthExpense > 0
      ? ((totalExpense - previousMonthExpense) / previousMonthExpense) * 100
      : 0

    // Calculate average daily spending
    const days = Math.ceil((currentMonthEnd.getTime() - currentMonthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const avgDailySpend = totalExpense / days

    // Spending forecast (if same rate continues until end of month)
    const today = new Date()
    const daysLeftInMonth = currentMonthEnd.getDate() - today.getDate()
    const projectedSpending = totalExpense + (avgDailySpend * daysLeftInMonth)

    return NextResponse.json({
      summary: {
        totalIncome,
        totalExpense,
        saved,
        transactionCount: transactions.length,
        previousMonthExpense,
        expenseChange,
        avgDailySpend: parseFloat(avgDailySpend.toFixed(2)),
        projectedSpending: parseFloat(projectedSpending.toFixed(2)),
      },
      topCategories,
      byCategory: sortedCategories,
      byAccount: Object.entries(byAccount).map(([id, data]) => ({ id, ...data })),
      dateRange: {
        from: fromDate,
        to: toDate,
      },
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Failed to analyze transactions' }, { status: 500 })
  }
}
