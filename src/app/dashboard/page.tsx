import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import BudgetTracker from '@/components/dashboard/BudgetTracker'
import { GoalsTracker } from '@/components/dashboard/GoalsTracker'
import RemindersWidget from '@/components/dashboard/RemindersWidget'
import { SimpleWelcome } from '@/components/onboarding/SimpleWelcome'
import { markWelcomeComplete } from './actions'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Fetch user to check onboarding status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Check if this is first visit (show simple welcome)
  const showWelcome = !user.onboardingCompleted && !user.onboardingSkipped

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
    // Get counts for onboarding wizard
    Promise.all([
      prisma.account.count({ where: { userId: session.user.id } }),
      prisma.transaction.count({ where: { userId: session.user.id } }),
      prisma.category.count({ where: { userId: session.user.id } }),
    ]),
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
    <>
      {/* Simple Welcome Popup - Only shows on first visit */}
      {showWelcome && (
        <SimpleWelcome
          userName={user.email?.split('@')[0] || 'User'}
          onClose={markWelcomeComplete}
        />
      )}

      {/* Complex Onboarding - COMPLETELY DISABLED */}
      {/* Will improve and re-enable later */}
      {/* DO NOT SHOW THIS ANYWHERE */}

      <div className="space-y-6">
        {/* Header Section */}
        <div className="px-4 pt-6 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2 sm:gap-3">
              <Link href="/dashboard/transactions/new" className="sm:w-auto">
                <Button className="w-full sm:w-auto h-auto sm:h-10 py-3 sm:py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">Transaction</span>
                </Button>
              </Link>
              <Link href="/dashboard/accounts/new" className="sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-auto sm:h-10 py-3 sm:py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">Account</span>
                </Button>
              </Link>
              <Link href="/dashboard/categories" className="sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-auto sm:h-10 py-3 sm:py-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                  <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm font-medium">Category</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-6 sm:px-6 space-y-6">
          <DashboardOverview
            accounts={accounts}
            transactions={transactions}
            categories={categories}
            recurringTransactions={recurringTransactions}
          />
          <BudgetTracker />
          <GoalsTracker />
          <RemindersWidget />
        </div>
      </div>
    </>
  )
}
