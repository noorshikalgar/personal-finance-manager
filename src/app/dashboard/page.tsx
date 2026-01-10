import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardOverview from '@/components/dashboard/DashboardOverview'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Fetch dashboard data
  const [accountsRaw, transactionsRaw, categoriesRaw, recurringTransactionsRaw] = await Promise.all([
    prisma.account.findMany({
      where: { userId: session.user.id },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      include: {
        category: true,
      },
    }),
    prisma.category.findMany({
      where: { userId: session.user.id },
    }),
    prisma.recurringTransaction.findMany({
      where: {
        userId: session.user.id,
        paused: false,
      },
      include: {
        account: true,
        category: true,
      },
    }),
  ])

  // Convert Decimal to number for client components
  const accounts = accountsRaw.map(acc => ({
    ...acc,
    monthlyIncome: acc.monthlyIncome ? Number(acc.monthlyIncome) : null,
    currentBalance: Number(acc.currentBalance),
    totalLimit: acc.totalLimit ? Number(acc.totalLimit) : null,
    availableLimit: acc.availableLimit ? Number(acc.availableLimit) : null,
  }))

  const categories = categoriesRaw.map(cat => ({
    ...cat,
    monthlyBudget: cat.monthlyBudget ? Number(cat.monthlyBudget) : null,
  }))

  const transactions = transactionsRaw.map(txn => ({
    ...txn,
    amount: Number(txn.amount),
    category: txn.category ? {
      ...txn.category,
      monthlyBudget: txn.category.monthlyBudget ? Number(txn.category.monthlyBudget) : null,
    } : null,
  }))

  const recurringTransactions = recurringTransactionsRaw.map(rec => ({
    ...rec,
    amount: Number(rec.amount),
    account: {
      ...rec.account,
      monthlyIncome: rec.account.monthlyIncome ? Number(rec.account.monthlyIncome) : null,
      currentBalance: Number(rec.account.currentBalance),
      totalLimit: rec.account.totalLimit ? Number(rec.account.totalLimit) : null,
      availableLimit: rec.account.availableLimit ? Number(rec.account.availableLimit) : null,
    },
    category: rec.category ? {
      ...rec.category,
      monthlyBudget: rec.category.monthlyBudget ? Number(rec.category.monthlyBudget) : null,
    } : null,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      <DashboardOverview
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        recurringTransactions={recurringTransactions}
      />
    </div>
  )
}
