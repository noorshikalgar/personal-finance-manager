'use client'

import { FormEvent, useState } from 'react'
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
  { name: 'Gray', value: '#6B7280' },
]

export default function NewCategoryPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [color, setColor] = useState(COLOR_OPTIONS[0].value)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          color,
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
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded px-4 py-3 text-sm">
              {error}
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
            <p className="text-sm font-medium text-foreground mb-2">Color</p>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setColor(option.value)}
                  className={`p-3 rounded-md border-2 transition-all ${
                    color === option.value
                      ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                      : 'border-border hover:border-border'
                  }`}
                  style={{ backgroundColor: `${option.value}20` }}
                >
                  <div className="w-full h-6 rounded" style={{ backgroundColor: option.value }} />
                  <p className="text-xs text-muted-foreground mt-1 text-center">{option.name}</p>
                </button>
              ))}
            </div>
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
