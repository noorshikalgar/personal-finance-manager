'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Account, Category } from '@prisma/client'
import { toast } from 'sonner'
import CategorySelector from '@/components/categories/CategorySelector'
import { DatePicker } from '@/components/ui/DatePicker'

export default function NewTransactionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [reminders, setReminders] = useState<any[]>([])
  
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [reminderId, setReminderId] = useState('')
  const [date, setDate] = useState<Date | null>(new Date())
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')
  const [note, setNote] = useState('')

  useEffect(() => {
    fetchAccounts()
    fetchCategories()
    fetchReminders()
  }, [])

  // Refetch reminders when category changes
  useEffect(() => {
    if (categoryId) {
      fetchReminders()
    }
  }, [categoryId])

  const fetchAccounts = async () => {
    const res = await fetch('/api/accounts')
    if (res.ok) {
      const data = await res.json()
      setAccounts(data)
      if (data.length > 0) setAccountId(data[0].id)
    }
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data)
    }
  }

  const fetchReminders = async () => {
    try {
      const res = await fetch('/api/reminders')
      if (res.ok) {
        const data = await res.json()
        // API returns array directly, not wrapped in object
        const allReminders = Array.isArray(data) ? data : []
        // Filter reminders by selected category if categoryId is set
        const filteredReminders = categoryId 
          ? allReminders.filter((r: any) => r.categoryId === categoryId)
          : allReminders
        setReminders(filteredReminders)
      } else {
        setReminders([])
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err)
      setReminders([])
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!accountId) {
        setError('Please select an account')
        setLoading(false)
        return
      }

      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount === 0) {
        setError('Please enter a valid amount')
        setLoading(false)
        return
      }

      // For expenses, make amount negative
      const finalAmount = type === 'EXPENSE' ? -Math.abs(numAmount) : Math.abs(numAmount)

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          categoryId: categoryId || null,
          reminderId: reminderId || null,
          date: date?.toISOString() || new Date().toISOString(),
          amount: finalAmount,
          type,
          note,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create transaction')
      }

      router.push('/dashboard/transactions')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (accounts.length === 0 && !loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 mb-4">
            You need to create an account first before adding transactions.
          </p>
          <Link href="/dashboard/accounts/new">
            <Button>Create Account</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/transactions">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Transactions
        </Button>
      </Link>

      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Add Transaction</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  type === 'INCOME'
                    ? 'border-green-500 bg-card'
                    : 'border-border hover:border-border'
                }`}
              >
                <div className="font-medium text-green-600">Money In</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Salary, refunds, etc.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  type === 'EXPENSE'
                    ? 'border-red-500 bg-card'
                    : 'border-border hover:border-border'
                }`}
              >
                <div className="font-medium text-red-600">Money Out</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Purchases, bills, etc.
                </div>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-foreground">
              Account *
            </label>
            <select
              id="accountId"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id} className="bg-card text-foreground">
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-foreground">
              Date *
            </label>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Select date"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-foreground">
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              required
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Enter positive amount only (direction is set by type above)
            </p>
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-foreground mb-1">
              Category (optional)
            </label>
            <CategorySelector
              value={categoryId}
              onChange={setCategoryId}
              placeholder="No category"
            />
          </div>

          <div>
            <label htmlFor="reminderId" className="block text-sm font-medium text-foreground">
              Link to Reminder (optional)
            </label>
            <select
              id="reminderId"
              value={reminderId}
              onChange={(e) => setReminderId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
            >
              <option value="" className="bg-card text-foreground">No reminder</option>
              {(reminders || []).map((reminder) => (
                <option key={reminder.id} value={reminder.id} className="bg-card text-foreground">
                  {reminder.title}
                  {reminder.category ? ` (${reminder.category.name})` : ''}
                </option>
              ))}
            </select>
            {categoryId && (reminders || []).length === 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                No reminders found for this category
              </p>
            )}
            {!categoryId && (reminders || []).length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Showing all reminders. Select a category to filter.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-foreground">
              Note (optional)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add details about this transaction..."
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding...' : 'Add Transaction'}
            </Button>
            <Link href="/dashboard/transactions" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
