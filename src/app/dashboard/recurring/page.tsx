import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, TrendingUp, TrendingDown, Pause, Play } from 'lucide-react'

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
    },
    orderBy: { createdAt: 'desc' },
  })

  // Convert Decimal to number
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  const calculateNextRunDate = (recurring: typeof recurringTransactions[0]) => {
    if (recurring.paused) return null
    if (recurring.endDate && new Date(recurring.endDate) < new Date()) return null

    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()

    // Start with this month
    let nextDate = new Date(currentYear, currentMonth, recurring.dayOfMonth)

    // If we already passed this month's day, use next month
    if (currentDay >= recurring.dayOfMonth) {
      nextDate = new Date(currentYear, currentMonth + 1, recurring.dayOfMonth)
    }

    // Check if lastRunAt is set and if we already ran this month
    if (recurring.lastRunAt) {
      const lastRun = new Date(recurring.lastRunAt)
      const lastRunMonth = lastRun.getMonth()
      const lastRunYear = lastRun.getFullYear()
      
      // If we already ran this month, next run is next month
      if (lastRunYear === currentYear && lastRunMonth === currentMonth) {
        nextDate = new Date(currentYear, currentMonth + 1, recurring.dayOfMonth)
      }
    }

    // Check if next date is after end date
    if (recurring.endDate && nextDate > new Date(recurring.endDate)) {
      return null
    }

    return nextDate
  }

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

      {recurringTransactions.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No recurring transactions yet</h3>
          <p className="mt-2 text-muted-foreground">
            Set up automatic recurring transactions like salary, rent, subscriptions, etc.
          </p>
          <div className="mt-6">
            <Link href="/dashboard/recurring/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Recurring Transaction
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {recurringTransactions.map((recurring) => {
            const nextRunDate = calculateNextRunDate(recurring)
            return (
              <Link
                key={recurring.id}
                href={`/dashboard/recurring/${recurring.id}`}
                className="block"
              >
                <div className="bg-card rounded-lg shadow-sm border border-border hover:border-primary hover:shadow-md transition-all overflow-hidden">
                  {/* Header with Icon and Title */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary to-secondary border-b border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg ${
                          recurring.type === 'INCOME' 
                            ? 'bg-accent/20 text-accent' 
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {recurring.type === 'INCOME' ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">
                          {recurring.note || 'Recurring Transaction'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Monthly on Day {recurring.dayOfMonth}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {recurring.paused ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground">
                          <Pause className="h-3 w-3 mr-1" />
                          Paused
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
                          <Play className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Amount */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Amount</p>
                        <p
                          className={`text-lg font-bold ${
                            recurring.type === 'INCOME' ? 'text-accent' : 'text-destructive'
                          }`}
                        >
                          {recurring.type === 'INCOME' ? '+' : '-'}
                          {formatCurrency(Math.abs(recurring.amount))}
                        </p>
                      </div>

                      {/* Account */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {recurring.account.name}
                        </p>
                      </div>

                      {/* Category */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        {recurring.category ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: (recurring.category.color || '#6B7280') + '20',
                              color: recurring.category.color || '#6B7280',
                            }}
                          >
                            {recurring.category.name}
                          </span>
                        ) : (
                          <p className="text-sm text-muted-foreground">No category</p>
                        )}
                      </div>

                      {/* Next Run */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Next Run</p>
                        {recurring.paused ? (
                          <p className="text-sm font-medium text-muted-foreground">Paused</p>
                        ) : nextRunDate ? (
                          <p className="text-sm font-semibold text-primary">
                            {formatDate(nextRunDate)}
                          </p>
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground">Ended</p>
                        )}
                      </div>
                    </div>

                    {/* Footer with Last Run and End Date */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs text-muted-foreground">
                        Last Run: <span className="font-medium text-foreground">{formatDate(recurring.lastRunAt)}</span>
                      </div>
                      {recurring.endDate && (
                        <div className="text-xs text-muted-foreground">
                          Ends: <span className="font-medium text-foreground">{formatDate(recurring.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

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

