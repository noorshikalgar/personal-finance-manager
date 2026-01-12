'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Pause, Play, Trash2, Calendar } from 'lucide-react'
import type { AccountWithNumbers, CategoryWithNumbers } from '@/types'
import Link from 'next/link'

interface RecurringWithNumbers {
  id: string
  amount: number
  type: string
  note: string | null
  dayOfMonth: number
  startDate: Date
  endDate: Date | null
  paused: boolean
  lastRunAt: Date | null
  account: AccountWithNumbers
  category: CategoryWithNumbers | null
}

interface RecurringDetailsClientProps {
  recurring: RecurringWithNumbers
  accounts: AccountWithNumbers[]
  categories: CategoryWithNumbers[]
}

export default function RecurringDetailsClient({
  recurring,
  accounts,
  categories,
}: RecurringDetailsClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPauseOptions, setShowPauseOptions] = useState(false)

  const calculateNextRunDate = () => {
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

  const [formData, setFormData] = useState({
    accountId: recurring.account.id,
    categoryId: recurring.category?.id || '',
    type: recurring.type,
    amount: Math.abs(recurring.amount).toString(),
    note: recurring.note || '',
    dayOfMonth: recurring.dayOfMonth.toString(),
    startDate: new Date(recurring.startDate).toISOString().split('T')[0],
    endDate: recurring.endDate
      ? new Date(recurring.endDate).toISOString().split('T')[0]
      : '',
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recurring/${recurring.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: formData.accountId,
          categoryId: formData.categoryId || null,
          type: formData.type,
          amount: parseFloat(formData.amount),
          note: formData.note || null,
          dayOfMonth: parseInt(formData.dayOfMonth),
          startDate: new Date(formData.startDate).toISOString(),
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        }),
      })

      if (!response.ok) throw new Error('Failed to update')

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update recurring transaction')
    } finally {
      setLoading(false)
    }
  }

  const handlePauseResume = async (duration?: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recurring/${recurring.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paused: !recurring.paused,
          duration, // '1month', '2months', or ISO date string
        }),
      })

      if (!response.ok) throw new Error('Failed to toggle pause')

      setShowPauseOptions(false)
      router.refresh()
    } catch (error) {
      console.error('Pause toggle error:', error)
      alert('Failed to pause/resume recurring transaction')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/recurring/${recurring.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      router.push('/dashboard/recurring')
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete recurring transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/recurring">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {recurring.note || 'Recurring Transaction'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {recurring.paused ? '⏸️ Paused' : '▶️ Active'} • Monthly on day {recurring.dayOfMonth}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button
                onClick={() => setShowPauseOptions(!showPauseOptions)}
                variant="outline"
                disabled={loading}
              >
                {recurring.paused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit
              </Button>
              <Button onClick={handleDelete} variant="outline" disabled={loading}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Amount Card */}
        <div className="bg-card rounded-lg shadow p-4 border-l-4" style={{borderLeftColor: recurring.type === 'INCOME' ? 'var(--accent)' : 'var(--destructive)'}}>
          <p className="text-sm text-muted-foreground mb-1">Amount</p>
          <p className={`text-2xl font-bold ${recurring.type === 'INCOME' ? 'text-accent' : 'text-destructive'}`}>
            {recurring.type === 'INCOME' ? '+' : '-'}${Math.abs(recurring.amount).toFixed(2)}
          </p>
        </div>

        {/* Account Card */}
        <div className="bg-card rounded-lg shadow p-4 border-l-4 border-primary">
          <p className="text-sm text-muted-foreground mb-1">Account</p>
          <p className="text-lg font-semibold text-foreground">{recurring.account.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{recurring.account.type}</p>
        </div>

        {/* Category Card */}
        <div className="bg-card rounded-lg shadow p-4 border-l-4 border-secondary">
          <p className="text-sm text-muted-foreground mb-1">Category</p>
          {recurring.category ? (
            <div>
              <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium" style={{
                backgroundColor: (recurring.category.color || '#6B7280') + '20',
                color: recurring.category.color || '#6B7280',
              }}>
                {recurring.category.name}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No category</p>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 bg-card rounded-lg shadow p-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Day of Month</p>
          <p className="text-lg font-semibold text-foreground">{recurring.dayOfMonth}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Start Date</p>
          <p className="text-lg font-semibold text-foreground">
            {new Date(recurring.startDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">End Date</p>
          <p className="text-lg font-semibold text-foreground">
            {recurring.endDate ? new Date(recurring.endDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : 'No end date'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Last Executed</p>
          <p className="text-lg font-semibold text-foreground">
            {recurring.lastRunAt ? new Date(recurring.lastRunAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : 'Never'}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Next Scheduled Run</p>
          <p className="text-lg font-semibold text-primary">
            {calculateNextRunDate() ? new Date(calculateNextRunDate()!).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }) : recurring.paused ? 'Paused' : 'Ended'}
          </p>
        </div>
        {recurring.note && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Note</p>
            <p className="text-sm text-foreground">{recurring.note}</p>
          </div>
        )}
      </div>

      {/* Pause Options */}
      {showPauseOptions && !recurring.paused && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">Pause for how long?</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handlePauseResume('1month')}
              variant="outline"
              size="sm"
            >
              1 Month
            </Button>
            <Button
              onClick={() => handlePauseResume('2months')}
              variant="outline"
              size="sm"
            >
              2 Months
            </Button>
            <Button
              onClick={() => handlePauseResume('3months')}
              variant="outline"
              size="sm"
            >
              3 Months
            </Button>
            <Button
              onClick={() => handlePauseResume()}
              variant="outline"
              size="sm"
            >
              Indefinitely
            </Button>
            <Button onClick={() => setShowPauseOptions(false)} variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Details Card */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 space-y-4">
          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Account
            </label>
            {isEditing ? (
              <select
                value={formData.accountId}
                onChange={(e) =>
                  setFormData({ ...formData, accountId: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id} className="bg-card text-foreground">
                    {account.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-foreground">{recurring.account.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Type
            </label>
            {isEditing ? (
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
              >
                <option value="INCOME" className="bg-card text-foreground">Income</option>
                <option value="EXPENSE" className="bg-card text-foreground">Expense</option>
              </select>
            ) : (
              <span
                className={`inline-flex px-2 py-1 rounded text-sm ${
                  recurring.type === 'INCOME'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {recurring.type}
              </span>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Amount
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            ) : (
              <p className="text-2xl font-bold text-foreground">
                ${Math.abs(recurring.amount).toFixed(2)}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Category
            </label>
            {isEditing ? (
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground"
              >
                <option value="" className="bg-card text-foreground">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="bg-card text-foreground">
                    {category.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-foreground">
                {recurring.category ? recurring.category.name : 'Uncategorized'}
              </p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Note
            </label>
            {isEditing ? (
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md"
                rows={3}
              />
            ) : (
              <p className="text-foreground">{recurring.note || 'No note'}</p>
            )}
          </div>

          {/* Day of Month */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Day of Month
            </label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="31"
                value={formData.dayOfMonth}
                onChange={(e) =>
                  setFormData({ ...formData, dayOfMonth: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            ) : (
              <p className="text-foreground">{recurring.dayOfMonth}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Start Date
            </label>
            {isEditing ? (
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            ) : (
              <p className="text-foreground">
                {new Date(recurring.startDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              End Date (Optional)
            </label>
            {isEditing ? (
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md"
              />
            ) : (
              <p className="text-foreground">
                {recurring.endDate
                  ? new Date(recurring.endDate).toLocaleDateString()
                  : 'No end date'}
              </p>
            )}
          </div>

          {/* Last Run */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Last Executed
            </label>
            <p className="text-foreground">
              {recurring.lastRunAt
                ? new Date(recurring.lastRunAt).toLocaleDateString()
                : 'Never'}
            </p>
          </div>

          {/* Next Run */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Next Scheduled Run
            </label>
            <p className="text-foreground">
              {recurring.paused ? (
                <span className="text-muted-foreground">Paused - No upcoming runs</span>
              ) : calculateNextRunDate() ? (
                <span className="font-semibold text-blue-600">
                  {new Date(calculateNextRunDate()!).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              ) : (
                <span className="text-muted-foreground">Ended</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
