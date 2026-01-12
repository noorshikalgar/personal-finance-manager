'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Amber', value: '#D97706' },
  { name: 'Gray', value: '#6B7280' },
]

type Goal = {
  id: string
  title: string
  targetAmount: number
  currentAmount: number
}

export default function NewCategoryPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0].value)
  const [customColor, setCustomColor] = useState('#3B82F6')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [goalId, setGoalId] = useState('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
          color: useCustomColor ? customColor : color,
          goalId: goalId && goalId.trim() !== '' ? goalId : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create category')
      }

      router.push('/dashboard/categories')
      router.refresh()
    } catch (submitError: any) {
      setError(submitError.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl w-full mx-auto space-y-8">
      <div>
        <Link href="/dashboard/categories" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Categories
        </Link>
        <h1 className="text-3xl font-bold text-foreground mt-2">Create Category</h1>
        <p className="text-muted-foreground mt-2">
          Add a category to organize your transactions and keep budgets on track.
        </p>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-2 border-red-500 rounded-lg px-4 py-3 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Category Name *
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Groceries, Rent, Entertainment"
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="monthlyBudget" className="block text-sm font-medium text-foreground">
              Monthly Budget (optional)
            </label>
            <input
              id="monthlyBudget"
              type="number"
              step="0.01"
              value={monthlyBudget}
              onChange={(event) => setMonthlyBudget(event.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              Budgets are informational only—they won’t block spending.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Color *</p>
            
            <div className="space-y-3">
              {/* Preset Colors - Always Visible */}
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    title={option.name}
                    onClick={() => {
                      setColor(option.value)
                      setUseCustomColor(false)
                    }}
                    className={`w-7 h-7 rounded border-2 transition-all hover:scale-110 ${
                      !useCustomColor && color === option.value
                        ? 'border-primary ring-2 ring-offset-1 ring-primary shadow-lg'
                        : 'border-border hover:border-primary/50'
                    }`}
                    style={{ backgroundColor: option.value }}
                  />
                ))}
              </div>

              {/* Custom Color Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="useCustomColor"
                  checked={useCustomColor}
                  onChange={(e) => setUseCustomColor(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <label htmlFor="useCustomColor" className="text-xs text-muted-foreground cursor-pointer">
                  or use custom color
                </label>
                {useCustomColor && (
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-7 w-16 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#000000"
                      className="w-24 px-2 py-1 border border-border rounded text-xs font-mono bg-card text-foreground"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="goalId" className="block text-sm font-medium text-foreground">
              Link to Goal (optional)
            </label>
            <select
              id="goalId"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-card text-foreground"
            >
              <option value="" className="bg-card text-foreground">No goal linked</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id} className="bg-card text-foreground">
                  {goal.title} - {Math.round((goal.currentAmount / goal.targetAmount) * 100)}% complete
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-muted-foreground">
              Link this category to a savings goal to track progress automatically.
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/dashboard/categories')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
