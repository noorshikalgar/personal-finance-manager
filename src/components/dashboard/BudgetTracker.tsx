'use client'

import { useEffect, useState } from 'react'
import { Category } from '@prisma/client'
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'

interface CategoryWithSpending extends Category {
  spent: number
  budgetPercent: number
  status: 'on-track' | 'caution' | 'exceeded'
}

export default function BudgetTracker() {
  const { formatAmount } = useAmountVisibility()
  const [categories, setCategories] = useState<CategoryWithSpending[]>([])
  const [loading, setLoading] = useState(true)
  const [totalBudget, setTotalBudget] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)

  useEffect(() => {
    fetchBudgetData()
  }, [])

  const fetchBudgetData = async () => {
    try {
      const res = await fetch('/api/budget')
      if (res.ok) {
        const data = await res.json()
        
        const categoriesWithStatus = data.categories.map(
          (cat: CategoryWithSpending) => ({
            ...cat,
            status: getStatus(cat.budgetPercent),
          })
        )
        
        setCategories(categoriesWithStatus)
        setTotalBudget(data.totalBudget)
        setTotalSpent(data.totalSpent)
      }
    } catch (error) {
      console.error('Failed to fetch budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (percent: number) => {
    if (percent > 100) return 'exceeded'
    if (percent >= 80) return 'caution'
    return 'on-track'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-destructive'
      case 'caution':
        return 'text-amber-500'
      default:
        return 'text-accent'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-destructive'
      case 'caution':
        return 'bg-amber-500'
      default:
        return 'bg-accent'
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow p-8 text-center border border-border">
        <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">No budgets set</h3>
        <p className="mt-2 text-muted-foreground">
          Add budget limits to your categories to track spending
        </p>
        <div className="mt-6">
          <Link href="/dashboard/categories">
            <Button>
              Manage Categories
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total Budget Summary */}
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-4">Budget Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Budget */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-foreground">
              {formatAmount(totalBudget)}
            </p>
          </div>

          {/* Total Spent */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-foreground">
              {formatAmount(totalSpent)}
            </p>
          </div>

          {/* Remaining */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-destructive' : 'text-accent'}`}>
              {formatAmount(totalBudget - totalSpent)}
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full">
          <p className="text-xs text-muted-foreground mb-2">Overall Budget Usage</p>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                totalSpent > totalBudget
                  ? 'bg-destructive'
                  : totalSpent / totalBudget > 0.8
                  ? 'bg-amber-500'
                  : 'bg-accent'
              }`}
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {((totalSpent / totalBudget) * 100).toFixed(0)}% used
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Categories</h3>
        
        {categories.map((category) => (
          <div key={category.id} className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {category.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <h4 className="font-medium text-foreground">{category.name}</h4>
                </div>
              </div>
              <span className={`text-sm font-semibold ${getStatusColor(category.status)}`}>
                {category.budgetPercent.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${getProgressColor(category.status)}`}
                  style={{ width: `${Math.min(category.budgetPercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Budget Details */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatAmount(category.spent)} spent</span>
              <span>
                {category.monthlyBudget
                  ? `Budget: ${formatAmount(Number(category.monthlyBudget))}`
                  : 'No budget set'}
              </span>
            </div>

            {/* Status Message */}
            {category.status === 'exceeded' && (
              <p className="text-xs text-destructive mt-2 font-medium">
                ⚠️ Over budget by {formatAmount(category.spent - Number(category.monthlyBudget || 0))}
              </p>
            )}
            {category.status === 'caution' && (
              <p className="text-xs text-amber-500 mt-2 font-medium">
                ⚡ {(100 - category.budgetPercent).toFixed(0)}% of budget remaining
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Edit Budgets Link */}
      <div className="text-center">
        <Link href="/dashboard/categories">
          <Button variant="outline" size="sm">
            Edit Budgets & Categories
          </Button>
        </Link>
      </div>
    </div>
  )
}
