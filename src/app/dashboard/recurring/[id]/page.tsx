import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import RecurringDetailsClient from '@/components/recurring/RecurringDetailsClient'
import type { AccountWithNumbers, CategoryWithNumbers } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RecurringDetailsPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect('/auth/signin')

  const { id } = await params
  const userId = session.user.id

  const recurring = await prisma.recurringTransaction.findUnique({
    where: { id, userId },
    include: {
      account: true,
      category: true,
      transactions: {
        orderBy: { date: 'desc' },
        take: 50, // Last 50 generated transactions
      },
    },
  })

  if (!recurring) {
    redirect('/dashboard/recurring')
  }

  // Fetch accounts and categories for editing
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    }),
  ])

  const recurringWithNumbers = {
    ...recurring,
    amount: parseFloat(recurring.amount.toString()),
    transactions: recurring.transactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount.toString()),
    })),
    account: {
      ...recurring.account,
      monthlyIncome: recurring.account.monthlyIncome
        ? parseFloat(recurring.account.monthlyIncome.toString())
        : null,
      currentBalance: parseFloat(recurring.account.currentBalance.toString()),
      totalLimit: recurring.account.totalLimit
        ? parseFloat(recurring.account.totalLimit.toString())
        : null,
      availableLimit: recurring.account.availableLimit
        ? parseFloat(recurring.account.availableLimit.toString())
        : null,
    } as AccountWithNumbers,
    category: recurring.category
      ? ({
          ...recurring.category,
          monthlyBudget: recurring.category.monthlyBudget
            ? parseFloat(recurring.category.monthlyBudget.toString())
            : null,
        } as CategoryWithNumbers)
      : null,
  }

  const accountsWithNumbers = accounts.map((account) => ({
    ...account,
    monthlyIncome: account.monthlyIncome
      ? parseFloat(account.monthlyIncome.toString())
      : null,
    currentBalance: parseFloat(account.currentBalance.toString()),
    totalLimit: account.totalLimit
      ? parseFloat(account.totalLimit.toString())
      : null,
    availableLimit: account.availableLimit
      ? parseFloat(account.availableLimit.toString())
      : null,
  })) as AccountWithNumbers[]

  const categoriesWithNumbers = categories.map((category) => ({
    ...category,
    monthlyBudget: category.monthlyBudget
      ? parseFloat(category.monthlyBudget.toString())
      : null,
  })) as CategoryWithNumbers[]

  return (
    <RecurringDetailsClient
      recurring={recurringWithNumbers}
      accounts={accountsWithNumbers}
      categories={categoriesWithNumbers}
    />
  )
}
