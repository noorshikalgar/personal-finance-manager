'use client'

import { Wallet, TrendingUp, TrendingDown, Calendar, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'
import { useState } from 'react'
import type { AccountWithNumbers, CategoryWithNumbers, TransactionWithCategory, RecurringWithRelations } from '@/types'

interface DashboardOverviewProps {
  accounts: AccountWithNumbers[]
  transactions: TransactionWithCategory[]
  categories: CategoryWithNumbers[]
  recurringTransactions: RecurringWithRelations[]
}

export default function DashboardOverview({
  accounts,
  transactions,
  categories,
  recurringTransactions,
}: DashboardOverviewProps) {
  const { formatAmount } = useAmountVisibility()
  const [showProjection, setShowProjection] = useState(true)

  // Calculate total balance across all bank accounts
  const totalBalance = accounts
    .filter(a => a.type === 'BANK_SALARY')
    .reduce((sum, a) => sum + Number(a.currentBalance), 0)

  // Calculate monthly income and expenses
  const monthlyIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const monthlyExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  // Category spending
  const categorySpending = categories.map(category => {
    const spent = transactions
      .filter(t => t.categoryId === category.id && t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    return {
      name: category.name,
      spent,
      budget: category.monthlyBudget ? Number(category.monthlyBudget) : null,
      color: category.color || '#3B82F6',
      percentage: category.monthlyBudget
        ? (spent / Number(category.monthlyBudget)) * 100
        : 0,
    }
  }).filter(c => c.spent > 0)

  // Upcoming recurring payments (next 30 days)
  const today = new Date()
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
  
  const upcomingRecurring = recurringTransactions
    .filter(r => r.type === 'EXPENSE')
    .map(r => {
      const nextDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        r.dayOfMonth
      )
      if (nextDate < today) {
        nextDate.setMonth(nextDate.getMonth() + 1)
      }
      return {
        ...r,
        nextDate,
      }
    })
    .filter(r => r.nextDate <= nextMonth)
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())

  // Next month projection
  const salaryAccounts = accounts.filter(a => a.type === 'BANK_SALARY')
  const expectedIncome = salaryAccounts.reduce(
    (sum, a) => sum + (a.monthlyIncome ? Number(a.monthlyIncome) : 0),
    0
  )
  const expectedExpenses = recurringTransactions
    .filter(r => r.type === 'EXPENSE' && !r.paused)
    .reduce((sum, r) => sum + Math.abs(Number(r.amount)), 0)
  
  const projectedBalance = totalBalance + expectedIncome - expectedExpenses

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Total Balance - Highlighted */}
        <div className="bg-linear-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-foreground">
                {formatAmount(totalBalance)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
          </div>
        </div>

        {/* Income and Expense - Side by Side on Mobile, Individual Cards on Desktop */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-2">
          <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
            <div className="flex items-center justify-between lg:flex-row">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5 text-green-500" />
                  </div>
                </div>
                <p className="text-xs lg:text-sm text-muted-foreground mb-1">Money In</p>
                <p className="text-lg lg:text-2xl font-bold text-green-500">
                  {formatAmount(monthlyIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-4 lg:p-5">
            <div className="flex items-center justify-between lg:flex-row">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 lg:h-5 lg:w-5 text-red-500" />
                  </div>
                </div>
                <p className="text-xs lg:text-sm text-muted-foreground mb-1">Money Out</p>
                <p className="text-lg lg:text-2xl font-bold text-red-500">
                  {formatAmount(monthlyExpenses)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Month Projection */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div 
          className="flex justify-between items-center p-5 cursor-pointer hover:bg-accent/5 transition-colors border-b border-border"
          onClick={() => setShowProjection(!showProjection)}
        >
          <h2 className="text-lg font-semibold text-foreground">Next Month Projection</h2>
          {showProjection ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
        </div>
        {showProjection && (
          <div className="p-5 space-y-3 bg-accent/5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Balance:</span>
              <span className="font-semibold text-foreground">{formatAmount(totalBalance)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">+ Expected Income:</span>
              <span className="font-semibold text-green-500">
                {formatAmount(expectedIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">- Recurring Payments:</span>
              <span className="font-medium text-destructive">
                {formatAmount(expectedExpenses)}
              </span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-card-foreground">Projected Balance:</span>
                <span className={`font-bold text-lg ${projectedBalance >= 0 ? 'text-accent' : 'text-destructive'}`}>
                  {formatAmount(projectedBalance)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Spending */}
        <div className="bg-card rounded-lg shadow">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-card-foreground">Category Spending</h2>
            <Link href="/dashboard/categories">
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </div>
          <div className="p-6">
            {categorySpending.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No spending this month
              </p>
            ) : (
              <div className="space-y-4">
                {categorySpending.slice(0, 5).map((cat) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-card-foreground">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {formatAmount(cat.spent)}
                        {cat.budget && ` / ${formatAmount(cat.budget)}`}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      {cat.budget ? (
                        <div
                          className={`h-2 rounded-full transition-all ${
                            cat.percentage > 100 ? 'bg-destructive' : cat.percentage > 80 ? 'bg-amber-500' : 'bg-accent'
                          }`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      ) : (
                        <div className="h-2 rounded-full bg-primary/30" style={{ width: '100%' }} />
                      )}
                    </div>
                    {!cat.budget && (
                      <p className="text-xs text-muted-foreground mt-1">No budget set</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Recurring */}
        <div className="bg-card rounded-lg shadow">
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-card-foreground">Upcoming Payments</h2>
            <Link href="/dashboard/recurring">
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </Link>
          </div>
          <div className="px-6 pb-6">
            {upcomingRecurring.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No upcoming recurring payments
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingRecurring.slice(0, 5).map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-muted-foreground dark:text-muted-foreground mr-2" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {rec.note || rec.category?.name || 'Recurring Payment'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rec.nextDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-destructive">
                      {formatAmount(Math.abs(Number(rec.amount)))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
