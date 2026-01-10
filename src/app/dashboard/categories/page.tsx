'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { Category } from '@prisma/client'
import { toast } from 'sonner'

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  
  const [name, setName] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [color, setColor] = useState('#3B82F6')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    const res = await fetch('/api/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
          color,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      // Track onboarding action and sync progress
      try {
        const trackResponse = await fetch('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add_category' }),
        })

        if (trackResponse.ok) {
          const trackData = await trackResponse.json()
          // Show smart message from backend
          toast.success(trackData.message || '✅ Category created successfully!')
        }
      } catch (error) {
        console.error('Error tracking onboarding action:', error)
        toast.success('✅ Category created successfully!')
      }

      setName('')
      setMonthlyBudget('')
      setColor('#3B82F6')
      setShowForm(false)
      router.refresh()
      fetchCategories()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure? Transactions with this category will become uncategorized.')) return

    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      fetchCategories()
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Categories</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Create New Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-card border border-border text-muted-foreground px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Groceries, Rent, Entertainment"
                className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="monthlyBudget" className="block text-sm font-medium text-foreground">
                Monthly Budget (optional)
              </label>
              <input
                type="number"
                id="monthlyBudget"
                step="0.01"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="0.00"
                className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Budget is visual only - no blocking or alerts
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => setColor(colorOption.value)}
                    className={`p-3 rounded-md border-2 transition-all ${
                      color === colorOption.value
                        ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900'
                        : 'border-border hover:border-border'
                    }`}
                    style={{ backgroundColor: `${colorOption.value}20` }}
                  >
                    <div
                      className="w-full h-6 rounded"
                      style={{ backgroundColor: colorOption.value }}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {colorOption.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" className="flex-1">
                Create Category
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setName('')
                  setMonthlyBudget('')
                  setColor('#3B82F6')
                  setError('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="bg-card rounded-lg shadow p-8 text-center">
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-8 text-center">
          <p className="text-muted-foreground mb-4">No categories yet</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Category
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-card rounded-lg shadow p-4 border-l-4"
              style={{ borderLeftColor: category.color || '#3B82F6' }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {category.monthlyBudget && (
                <p className="text-sm text-muted-foreground">
                  Budget: {formatCurrency(Number(category.monthlyBudget))}/month
                </p>
              )}
              <div
                className="mt-2 h-2 rounded-full"
                style={{ backgroundColor: `${category.color}30` }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: category.color || '#3B82F6', width: '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
