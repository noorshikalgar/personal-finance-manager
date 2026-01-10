import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all categories for user with budgets
    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    })

    // Get current month date range
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Calculate spending per category for current month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        category: true,
      },
    })

    // Group spending by category
    const spendingByCategory = new Map<string, number>()
    
    transactions.forEach((txn) => {
      const categoryId = txn.categoryId || 'uncategorized'
      const amount = Math.abs(Number(txn.amount)) // Always positive for spending
      const current = spendingByCategory.get(categoryId) || 0
      spendingByCategory.set(categoryId, current + amount)
    })

    // Build response with budget info
    let totalBudget = 0
    let totalSpent = 0

    const categoriesWithSpending = categories
      .filter((cat) => cat.monthlyBudget) // Only include categories with budgets
      .map((cat) => {
        const spent = spendingByCategory.get(cat.id) || 0
        const budget = Number(cat.monthlyBudget || 0)
        const budgetPercent = budget > 0 ? (spent / budget) * 100 : 0

        totalBudget += budget
        totalSpent += spent

        return {
          ...cat,
          monthlyBudget: cat.monthlyBudget ? Number(cat.monthlyBudget) : null,
          spent,
          budgetPercent,
        }
      })

    return NextResponse.json({
      categories: categoriesWithSpending,
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
    })
  } catch (error) {
    console.error('Budget API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget data' },
      { status: 500 }
    )
  }
}
