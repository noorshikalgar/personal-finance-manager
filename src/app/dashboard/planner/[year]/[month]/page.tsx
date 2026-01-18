import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import PlannerDetailClient from '@/components/planner/PlannerDetailClient'

interface PlannerDetailPageProps {
  params: Promise<{
    year: string
    month: string
  }>
}

export default async function PlannerDetailPage({ params }: PlannerDetailPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { year, month } = await params
  const yearNum = parseInt(year)
  const monthNum = parseInt(month)

  // Validate month and year
  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    notFound()
  }

  // Fetch the plan
  const planRaw = await prisma.monthlyPlan.findUnique({
    where: {
      userId_month_year: {
        userId: session.user.id,
        month: monthNum,
        year: yearNum,
      },
    },
    include: {
      items: {
        include: {
          category: true,
          transaction: true,
          recurringTransaction: {
            select: {
              id: true,
              amount: true,
              note: true,
              type: true,
              dayOfMonth: true,
              categoryId: true,
            },
          },
        },
        orderBy: [
          { isPaid: 'asc' }, // Unpaid first
          { dueDate: 'asc' }, // Then by due date
        ],
      },
    },
  })

  // If plan doesn't exist, redirect to create it
  if (!planRaw) {
    notFound()
  }

  // Fetch categories for adding new items
  const categoriesRaw = await prisma.category.findMany({
    where: { userId: session.user.id },
  })

  // Fetch recurring transactions for importing
  const recurringRaw = await prisma.recurringTransaction.findMany({
    where: {
      userId: session.user.id,
      paused: false,
    },
    select: {
      id: true,
      amount: true,
      note: true,
      type: true,
      dayOfMonth: true,
      categoryId: true,
      linkedToAccountIncome: true,
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  })

  // Serialize recurring transactions to plain objects
  const recurring = recurringRaw.map((rec) => ({
    id: rec.id,
    amount: Number(rec.amount),
    note: rec.note,
    type: rec.type,
    dayOfMonth: rec.dayOfMonth,
    categoryId: rec.categoryId,
    linkedToAccountIncome: rec.linkedToAccountIncome,
    category: rec.category
      ? {
          id: rec.category.id,
          name: rec.category.name,
          color: rec.category.color,
        }
      : null,
  }))

  // Convert Decimal to number
  const plan = {
    ...planRaw,
    expectedIncome: Number(planRaw.expectedIncome),
    items: planRaw.items.map((item) => ({
      ...item,
      amount: Number(item.amount),
      category: item.category
        ? {
            ...item.category,
            monthlyBudget: item.category.monthlyBudget
              ? Number(item.category.monthlyBudget)
              : null,
          }
        : null,
      transaction: item.transaction
        ? {
            ...item.transaction,
            amount: Number(item.transaction.amount),
          }
        : null,
      recurringTransaction: item.recurringTransaction
        ? {
            ...item.recurringTransaction,
            amount: Number(item.recurringTransaction.amount),
          }
        : null,
    })),
  }

  const categories = categoriesRaw.map((cat) => ({
    ...cat,
    monthlyBudget: cat.monthlyBudget ? Number(cat.monthlyBudget) : null,
  }))

  return (
    <PlannerDetailClient
      initialPlan={plan}
      categories={categories}
      recurringTransactions={recurring}
      currentMonth={monthNum}
      currentYear={yearNum}
    />
  )
}
