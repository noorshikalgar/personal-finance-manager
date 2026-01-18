import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import RecurringList from '@/components/recurring/RecurringList'

export default async function RecurringPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const recurringTransactionsRaw = await prisma.recurringTransaction.findMany({
    where: { userId: session.user.id },
    include: {
      account: true,
      category: true,
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Convert Decimal to number
  const recurringTransactions = recurringTransactionsRaw.map(rec => ({
    ...rec,
    amount: Number(rec.amount),
    transactionCount: rec._count.transactions,
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Recurring Transactions</h1>
        <Link href="/dashboard/recurring/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Recurring
          </Button>
        </Link>
      </div>

      <RecurringList recurringTransactions={recurringTransactions} />

      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="font-semibold text-foreground mb-2">ℹ️ How Recurring Transactions Work</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Recurring transactions run monthly on the day you specify (1-31)</li>
          <li>• A cron job runs daily to check and create transactions for the current day</li>
          <li>• You can pause/resume recurring transactions at any time</li>
          <li>• Set an end date to automatically stop recurring transactions</li>
        </ul>
      </div>
    </div>
  )
}

