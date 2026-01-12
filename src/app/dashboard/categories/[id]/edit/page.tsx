'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [monthlyBudget, setMonthlyBudget] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [useCustomColor, setUseCustomColor] = useState(false)
  const [customColor, setCustomColor] = useState('#3B82F6')
  const [goalId, setGoalId] = useState('')
  const [goals, setGoals] = useState<any[]>([])

  useEffect(() => {
    fetchCategory()
    fetchGoals()
  }, [categoryId])

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

  const fetchCategory = async () => {
    try {
      const res = await fetch(`/api/categories/${categoryId}`)
      if (!res.ok) throw new Error('Failed to fetch category')

      const category = await res.json()
      setName(category.name)
      setMonthlyBudget(category.monthlyBudget?.toString() || '')
      setGoalId(category.goalId || '')
      
      if (category.color) {
        const isPresetColor = COLOR_OPTIONS.some(opt => opt.value === category.color)
        if (isPresetColor) {
          setColor(category.color)
          setUseCustomColor(false)
        } else {
          setCustomColor(category.color)
          setUseCustomColor(true)
        }
      }
    } catch (err) {
      setError('Failed to load category')
      toast.error('Failed to load category')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Failed to update category')
      }

      toast.success('Category updated successfully')
      router.push('/dashboard/categories')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      toast.error(err.message || 'Failed to update category')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/categories">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Categories
        </Button>
      </Link>

      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Category</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
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
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
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
              {/* Preset Colors */}
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((colorOption) => (
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

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href="/dashboard/categories" className="flex-1">
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
