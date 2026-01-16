'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartLegend } from '@/components/ui/chart'
import { BarChart3, Table2 } from 'lucide-react'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'
import { DatePicker } from '@/components/ui/DatePicker'

interface Account {
  id: string
  name: string
}

interface AnalyzeData {
  summary: {
    totalIncome: number
    totalExpense: number
    saved: number
    transactionCount: number
    previousMonthExpense?: number
    expenseChange?: number
    avgDailySpend?: number
    projectedSpending?: number
  }
  topCategories?: Array<{
    name: string
    amount: number
    color?: string
    count: number
    budget: number
  }>
  byCategory: Array<{
    name: string
    amount: number
    color?: string
    count: number
    budget: number
  }>
  byAccount: Array<{
    id: string
    name: string
    income: number
    expense: number
  }>
  dateRange: {
    from?: string
    to?: string
  }
}

export default function AnalyzeClient() {
  const { formatAmount } = useAmountVisibility()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalyzeData | null>(null)
  const [analyzed, setAnalyzed] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('graph')
  const [activePreset, setActivePreset] = useState<'this-month' | 'last-month' | 'last-3-months' | null>('this-month')

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts')
        if (res.ok) {
          const result = await res.json()
          setAccounts(result)
          // Select all accounts by default
          setSelectedAccounts(result.map((a: Account) => a.id))
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
      }
    }
    fetchAccounts()
    // Set default dates to "This Month"
    setDatePreset('this-month')
  }, [])

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      selectedAccounts.forEach((id) => params.append('accountIds', id))
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const res = await fetch(`/api/analyze?${params}`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
        setAnalyzed(true)
      }
    } catch (error) {
      console.error('Analyze error:', error)
      alert('Failed to analyze transactions')
    } finally {
      setLoading(false)
    }
  }

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    )
  }

  const setDatePreset = (preset: string) => {
    const today = new Date()
    let from = new Date()
    let to = new Date(today)

    switch (preset) {
      case 'this-month':
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        setActivePreset('this-month')
        break
      case 'last-month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        setActivePreset('last-month')
        break
      case 'last-3-months':
        from = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
        setActivePreset('last-3-months')
        break
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    setFromDate(formatDate(from))
    setToDate(formatDate(to))
  }

  // Function to check if current dates match a preset
  const checkDatePreset = () => {
    if (!fromDate || !toDate) return

    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    // Check This Month
    const thisMonthFrom = new Date(today.getFullYear(), today.getMonth(), 1)
    if (formatDate(thisMonthFrom) === fromDate && formatDate(today) === toDate) {
      setActivePreset('this-month')
      return
    }

    // Check Last Month
    const lastMonthFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthTo = new Date(today.getFullYear(), today.getMonth(), 0)
    if (formatDate(lastMonthFrom) === fromDate && formatDate(lastMonthTo) === toDate) {
      setActivePreset('last-month')
      return
    }

    // Check Last 3 Months
    const last3MonthsFrom = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
    if (formatDate(last3MonthsFrom) === fromDate && formatDate(today) === toDate) {
      setActivePreset('last-3-months')
      return
    }

    // Custom date range - clear active
    setActivePreset(null)
  }

  // Monitor date changes
  useEffect(() => {
    checkDatePreset()
  }, [fromDate, toDate])

  return (
    <div className="space-y-8">
      {/* Filters Section */}
      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Filters</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Accounts</label>
            <div className="space-y-2">
              {accounts.map((account) => (
                <label key={account.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(account.id)}
                    onChange={() => toggleAccount(account.id)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="ml-2 text-sm text-foreground">{account.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Date From</label>
            <DatePicker
              value={fromDate ? new Date(fromDate) : null}
              onChange={(date) => setFromDate(date ? date.toISOString().split('T')[0] : '')}
              placeholder="Select start date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Date To</label>
            <DatePicker
              value={toDate ? new Date(toDate) : null}
              onChange={(date) => setToDate(date ? date.toISOString().split('T')[0] : '')}
              placeholder="Select end date"
            />
          </div>
        </div>

        {/* Date Presets */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => setDatePreset('this-month')}
            variant={activePreset === 'this-month' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
          >
            This Month
          </Button>
          <Button
            onClick={() => setDatePreset('last-month')}
            variant={activePreset === 'last-month' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
          >
            Last Month
          </Button>
          <Button
            onClick={() => setDatePreset('last-3-months')}
            variant={activePreset === 'last-3-months' ? 'default' : 'outline'}
            size="sm"
            className="text-xs"
          >
            Last 3 Months
          </Button>
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={loading || selectedAccounts.length === 0}
          className="mt-6 w-full lg:w-auto"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </div>

      {/* Results Section */}
      {analyzed && data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Income</p>
              <p className="text-2xl font-bold text-accent">
                {formatAmount(data.summary.totalIncome)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {data.summary.transactionCount > 0 ? 'Income tracked' : 'No income'}
              </p>
            </div>

            {/* Total Expense */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Total Expense</p>
              <p className="text-2xl font-bold text-destructive">
                {formatAmount(data.summary.totalExpense)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {data.summary.transactionCount > 0 ? 'Expenses tracked' : 'No expenses'}
              </p>
            </div>

            {/* Saved */}
            <div
              className={`rounded-lg p-6 border border-border ${
                data.summary.saved >= 0
                  ? 'bg-card'
                  : 'bg-card'
              }`}
            >
              <p className="text-sm font-medium text-muted-foreground mb-2">Saved / Deficit</p>
              <p
                className={`text-2xl font-bold ${
                  data.summary.saved >= 0 ? 'text-primary' : 'text-destructive'
                }`}
              >
                {formatAmount(data.summary.saved)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {data.summary.saved >= 0 ? 'You saved this amount' : 'You spent more than earned'}
              </p>
            </div>

            {/* Transaction Count */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Transactions</p>
              <p className="text-2xl font-bold text-primary">{data.summary.transactionCount}</p>
              <p className="text-xs text-muted-foreground mt-2">Total in this period</p>
            </div>
          </div>

          {/* Additional Analytics Cards */}
          {(data.summary.avgDailySpend || data.summary.projectedSpending || data.summary.expenseChange !== undefined) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Average Daily Spend */}
              {data.summary.avgDailySpend && (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Average Daily Spend</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatAmount(data.summary.avgDailySpend)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Per day average</p>
                </div>
              )}

              {/* Projected Spending */}
              {data.summary.projectedSpending && (
                <div className="bg-card rounded-lg p-6 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Projected Spending</p>
                  <p className="text-2xl font-bold text-accent">
                    {formatAmount(data.summary.projectedSpending)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">If trend continues</p>
                </div>
              )}

              {/* Period Comparison */}
              {data.summary.expenseChange !== undefined && (
                <div className={`rounded-lg p-6 border border-border bg-card`}>
                  <p className="text-sm font-medium text-muted-foreground mb-2">vs Previous Month</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-2xl font-bold ${
                      data.summary.expenseChange <= 0
                        ? 'text-accent'
                        : 'text-destructive'
                    }`}>
                      {data.summary.expenseChange <= 0 ? '↓' : '↑'} {Math.abs(data.summary.expenseChange).toFixed(1)}%
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {data.summary.expenseChange <= 0 ? 'Spending decreased' : 'Spending increased'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Top Categories Widget */}
          {data.topCategories && data.topCategories.length > 0 && (
            <div className="bg-card rounded-lg shadow p-6 border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-6">Top Spending Categories</h3>
              <div className="space-y-3">
                {data.topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color || '#3b82f6' }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatAmount(category.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((category.amount / data.summary.totalExpense) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 bg-card rounded-lg shadow p-4 border border-border">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-secondary'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Chart
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-foreground hover:bg-muted'
              }`}
            >
              <Table2 className="h-4 w-4" />
              Details
            </button>
          </div>

          {/* Spending by Category */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Spending by Category</h3>
            {data.byCategory.length > 0 ? (
              <>
                {viewMode === 'graph' ? (
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.byCategory.map((cat) => ({
                            name: cat.name,
                            value: Number(cat.amount.toFixed(2)),
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data.byCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatAmount(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.byCategory.map((category) => {
                      const percentage = (
                        (category.amount / data.summary.totalExpense) *
                        100
                      ).toFixed(1)
                      const budgetExceeded =
                        category.budget > 0 && category.amount > category.budget
                      const budgetStatus =
                        category.budget > 0
                          ? category.amount <= category.budget
                            ? 'Within Budget'
                            : `Over by ${formatAmount(category.amount - category.budget)}`
                          : 'No Budget'

                      return (
                        <div key={category.name} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {category.color && (
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              <h4 className="text-sm font-semibold text-foreground">
                                {category.name}
                              </h4>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                budgetExceeded
                                  ? 'bg-red-100 text-muted-foreground'
                                  : category.budget > 0
                                    ? 'bg-green-100 text-muted-foreground'
                                    : 'bg-muted text-foreground'
                              }`}
                            >
                              {budgetStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
                            <div className="bg-secondary rounded p-2">
                              <p className="text-muted-foreground">Spent</p>
                              <p className="font-semibold text-foreground">
                                {formatAmount(category.amount)}
                              </p>
                            </div>
                            <div className="bg-secondary rounded p-2">
                              <p className="text-muted-foreground">Budget</p>
                              <p className="font-semibold text-foreground">
                                {category.budget > 0 ? formatAmount(category.budget) : '—'}
                              </p>
                            </div>
                            <div className="bg-secondary rounded p-2">
                              <p className="text-muted-foreground">
                                {category.budget > 0 ? '% of Budget' : '% of Total'}
                              </p>
                              <p className="font-semibold text-foreground">
                                {category.budget > 0
                                  ? Math.min(((category.amount / category.budget) * 100), 100).toFixed(1)
                                  : percentage}
                                %
                              </p>
                            </div>
                          </div>

                          <div className="w-full bg-muted rounded-md h-3 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                budgetExceeded ? 'bg-card0' : 'bg-card0'
                              }`}
                              style={{
                                width: `${
                                  category.budget > 0
                                    ? Math.min((category.amount / category.budget) * 100, 100)
                                    : (category.amount / data.summary.totalExpense) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No expense data available</p>
            )}
          </div>

          {/* By Account Breakdown */}
          <div className="bg-card rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Breakdown by Account</h3>
            {data.byAccount.length > 0 ? (
              <>
                {viewMode === 'graph' ? (
                  <div className="space-y-6">
                    {data.byAccount.map((account) => {
                      const net = account.income - account.expense
                      const total = account.income + account.expense
                      const incomePercent = total > 0 ? (account.income / total) * 100 : 0
                      const expensePercent = total > 0 ? (account.expense / total) * 100 : 0
                      const savingRate = account.income > 0 ? ((net / account.income) * 100).toFixed(1) : 0

                      return (
                        <div key={account.id} className="border border-border rounded-lg p-4">
                          <div className="mb-4 flex justify-between items-center">
                            <h4 className="font-semibold text-foreground">{account.name}</h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                net >= 0
                                  ? 'bg-green-100 text-muted-foreground'
                                  : 'bg-red-100 text-muted-foreground'
                              }`}
                            >
                              {net >= 0 ? 'Savings' : 'Deficit'}
                            </span>
                          </div>

                          {/* Stacked visualization */}
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Expense Status</p>
                                  <p className="text-sm font-semibold text-foreground">
                                    {data.summary.totalExpense > 0
                                      ? account.expense > 0
                                        ? `${(
                                            (account.expense / data.summary.totalExpense) *
                                            100
                                          ).toFixed(1)}% of Total`
                                        : 'No Expenses'
                                      : 'N/A'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Income vs Expense</p>
                                  <p className="text-sm font-semibold text-foreground">
                                    {incomePercent.toFixed(0)}% / {expensePercent.toFixed(0)}%
                                  </p>
                                </div>
                              </div>
                              <div className="flex h-8 gap-1 rounded-md overflow-hidden bg-muted">
                                {account.income > 0 && (
                                  <div
                                    className="bg-card0 transition-all duration-300 hover:brightness-110"
                                    style={{ width: `${incomePercent}%` }}
                                    title={`Income: ${formatAmount(account.income)}`}
                                  />
                                )}
                                {account.expense > 0 && (
                                  <div
                                    className="bg-card0 transition-all duration-300 hover:brightness-110"
                                    style={{ width: `${expensePercent}%` }}

                                    title={`Expense: ${formatAmount(account.expense)}`}
                                  />
                                )}
                                {total === 0 && (
                                  <div className="w-full bg-gray-300" />
                                )}
                              </div>
                            </div>

                            {/* Saving Rate */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-muted-foreground">Saving Rate</span>
                                <span className="text-xs font-semibold text-foreground">
                                  {savingRate}%
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-md h-2 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    Number(savingRate) >= 0 ? 'bg-card0' : 'bg-orange-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(Math.max((Number(savingRate) / 100) * 100, 0), 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-3 gap-2 pt-2">
                              <div className="bg-card rounded p-3 text-center">
                                <p className="text-xs text-muted-foreground">Income</p>
                                <p className="text-sm font-bold text-green-600">
                                  {formatAmount(account.income)}
                                </p>
                              </div>
                              <div className="bg-card rounded p-3 text-center">
                                <p className="text-xs text-muted-foreground">Expense</p>
                                <p className="text-sm font-bold text-red-600">
                                  {formatAmount(account.expense)}
                                </p>
                              </div>
                              <div
                                className={`rounded p-3 text-center ${
                                  net >= 0 ? 'bg-card' : 'bg-orange-50'
                                }`}
                              >
                                <p className="text-xs text-muted-foreground">Net</p>
                                <p
                                  className={`text-sm font-bold ${
                                    net >= 0 ? 'text-blue-600' : 'text-orange-600'
                                  }`}
                                >
                                  {formatAmount(net)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {data.byAccount.map((account) => {
                      const net = account.income - account.expense
                      const total = account.income + account.expense
                      const incomePercent = total > 0 ? (account.income / total) * 100 : 0
                      const expensePercent = total > 0 ? (account.expense / total) * 100 : 0
                      const expenseStatus =
                        data.summary.totalExpense > 0
                          ? account.expense > 0
                            ? `${(
                                (account.expense / data.summary.totalExpense) *
                                100
                              ).toFixed(1)}% of Total`
                            : 'No Expenses'
                          : 'N/A'

                      return (
                        <div key={account.id} className="border border-border rounded-lg p-4">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-card0" />
                                <h4 className="text-sm font-semibold text-foreground">{account.name}</h4>
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  net >= 0
                                    ? 'bg-green-100 text-muted-foreground'
                                    : 'bg-red-100 text-muted-foreground'
                                }`}
                              >
                                {net >= 0 ? 'Savings' : 'Deficit'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                              <div className="bg-secondary rounded p-2">
                                <p className="text-xs text-muted-foreground">Expense Status</p>
                                <p className="font-semibold text-foreground">{expenseStatus}</p>
                              </div>
                              <div className="bg-secondary rounded p-2">
                                <p className="text-xs text-muted-foreground">Income vs Expense</p>
                                <p className="font-semibold text-foreground">
                                  {incomePercent.toFixed(0)}% / {expensePercent.toFixed(0)}%
                                </p>
                              </div>
                            </div>

                            <div className="flex h-8 gap-1 rounded-md overflow-hidden bg-muted">
                              {account.income > 0 && (
                                <div
                                  className="bg-card0 transition-all duration-300 hover:brightness-110"
                                  style={{ width: `${incomePercent}%` }}
                                  title={`Income: ${formatAmount(account.income)}`}
                                />
                              )}
                              {account.expense > 0 && (
                                <div
                                  className="bg-card0 transition-all duration-300 hover:brightness-110"
                                  style={{ width: `${expensePercent}%` }}
                                  title={`Expense: ${formatAmount(account.expense)}`}
                                />
                              )}
                              {total === 0 && <div className="w-full bg-gray-300" />}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-card rounded p-3 text-center">
                              <p className="text-xs text-muted-foreground">Income</p>
                              <p className="text-sm font-bold text-green-600">
                                {formatAmount(account.income)}
                              </p>
                            </div>
                            <div className="bg-card rounded p-3 text-center">
                              <p className="text-xs text-muted-foreground">Expense</p>
                              <p className="text-sm font-bold text-red-600">
                                {formatAmount(account.expense)}
                              </p>
                            </div>
                            <div
                              className={`rounded p-3 text-center ${
                                net >= 0 ? 'bg-card' : 'bg-orange-50'
                              }`}
                            >
                              <p className="text-xs text-muted-foreground">Net</p>
                              <p
                                className={`text-sm font-bold ${
                                  net >= 0 ? 'text-blue-600' : 'text-orange-600'
                                }`}
                              >
                                {formatAmount(net)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No account data available</p>
            )}
          </div>

          {/* Date Range Info */}
          {(data.dateRange.from || data.dateRange.to) && (
            <div className="bg-card rounded-lg p-4 border border-border">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Analysis Period:</span>{' '}
                {data.dateRange.from ? new Date(data.dateRange.from).toLocaleDateString() : 'Start'}{' '}
                to {data.dateRange.to ? new Date(data.dateRange.to).toLocaleDateString() : 'Today'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!analyzed && (
        <div className="bg-card rounded-lg p-12 text-center border border-border">
          <p className="text-muted-foreground mb-4">Select accounts and dates, then click Analyze to see your financial report</p>
        </div>
      )}
    </div>
  )
}
