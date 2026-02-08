'use client'

import { useEffect, useState } from 'react'
import { TransactionFullCalendar } from '@/components/transactions/TransactionFullCalendar'
import { Transaction } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Account {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

export default function CalendarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/accounts'),
        fetch('/api/categories'),
      ])

      if (!transactionsRes.ok || !accountsRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [transactionsData, accountsData, categoriesData] = await Promise.all([
        transactionsRes.json(),
        accountsRes.json(),
        categoriesRes.json(),
      ])

      // Handle both array and object responses
      setTransactions(Array.isArray(transactionsData) ? transactionsData : transactionsData.transactions || [])
      setAccounts(Array.isArray(accountsData) ? accountsData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load calendar data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-150">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-150">
        <div className="text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={fetchData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Transaction Calendar</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage your transactions in calendar format
            </p>
          </div>
        </div>

        <Link href="/dashboard/transactions/new">
          <Button>
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Calendar */}
      <TransactionFullCalendar
        transactions={transactions}
        accounts={accounts}
        categories={categories}
      />

      {/* Help Text */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg border">
        <p className="font-medium mb-2">Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Click on any date to create a new transaction for that day</li>
          <li>Click on transaction events to view them in the sidebar</li>
          <li>Green events = Income, Red events = Expenses</li>
          <li>Use filters to focus on specific accounts, categories, or transaction types</li>
          <li>Switch between Month and Week views using the toolbar buttons</li>
          <li>Click &quot;+X more&quot; to see all transactions on a busy day</li>
        </ul>
      </div>
    </div>
  )
}
