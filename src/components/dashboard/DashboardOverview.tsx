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
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">
                {formatAmount(totalBalance)}
              </p>
            </div>
            <Wallet className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Money In (This Month)</p>
              <p className="text-2xl font-bold text-accent mt-1">
                {formatAmount(monthlyIncome)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Money Out (This Month)</p>
              <p className="text-2xl font-bold text-destructive mt-1">
                {formatAmount(monthlyExpenses)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-destructive" />
          </div>
        </div>
      </div>

      {/* Next Month Projection */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg shadow border border-primary/20">
        <div 
          className="flex justify-between items-center p-6 cursor-pointer hover:bg-primary/5"
          onClick={() => setShowProjection(!showProjection)}
        >
          <h2 className="text-lg font-semibold text-card-foreground">Next Month Projection</h2>
          {showProjection ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
        {showProjection && (
          <div className="px-6 pb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="font-medium text-card-foreground">{formatAmount(totalBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">+ Expected Income:</span>
              <span className="font-medium text-accent">
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
          <div className="px-6 pb-6">
            {categorySpending.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No spending this month
              </p>
            ) : (
              <div className="space-y-4">
                {categorySpending.slice(0, 5).map((cat) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-card-foreground">{cat.name}</span>
                      <span className="text-muted-foreground">
                        {formatAmount(cat.spent)}
                        {cat.budget && ` / ${formatAmount(cat.budget)}`}
                      </span>
                    </div>
                    {cat.budget && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            cat.percentage > 100 ? 'bg-destructive' : cat.percentage > 80 ? 'bg-secondary' : 'bg-accent'
                          }`}
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      </div>
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
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <div>
                        <p className="text-sm font-medium text-card-foreground">
                          {rec.category?.name || 'Uncategorized'}
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

      {/* Quick Actions */}
      <div className="flex gap-4 flex-wrap">
        <Link href="/dashboard/transactions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </Link>
        <Link href="/dashboard/accounts/new">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </Link>
        <Link href="/dashboard/categories">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>
    </div>
  )
}
