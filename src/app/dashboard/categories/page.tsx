'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit } from 'lucide-react'
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
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customColor, setCustomColor] = useState('#3B82F6')
  const [goalId, setGoalId] = useState('')
  const [goals, setGoals] = useState<any[]>([])

  useEffect(() => {
    fetchCategories()
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error)
    }
  }

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
          color: useCustomColor ? customColor : color,
          goalId: goalId && goalId.trim() !== '' ? goalId : null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      setName('')
      setMonthlyBudget('')
      setColor('#3B82F6')
      setUseCustomColor(false)
      setCustomColor('#3B82F6')
      setGoalId('')
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
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-2 border-red-500 rounded-lg px-4 py-3 text-sm font-medium">
                ⚠️ {error}
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
                Color *
              </label>
              
              <div className="space-y-3">
                {/* Preset Colors - Always Visible */}
                <div className="flex flex-wrap gap-1.5">
                  {colorOptions.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      title={colorOption.name}
                      onClick={() => {
                        setColor(colorOption.value)
                        setUseCustomColor(false)
                      }}
                      className={`w-7 h-7 rounded border-2 transition-all hover:scale-110 ${
                        !useCustomColor && color === colorOption.value
                          ? 'border-primary ring-2 ring-offset-1 ring-primary shadow-lg'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: colorOption.value }}
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
                Link this category to track progress towards a savings goal.
              </p>
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
                  setUseCustomColor(false)
                  setCustomColor('#3B82F6')
                  setGoalId('')
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
                <div className="flex gap-2">
                  <Link href={`/dashboard/categories/${category.id}/edit`}>
                    <button
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Edit category"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    title="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
