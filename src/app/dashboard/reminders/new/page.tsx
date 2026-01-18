'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import CategorySelector from '@/components/categories/CategorySelector'
import { DatePicker } from '@/components/ui/DatePicker'

export default function NewReminderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cycle: 'MONTHLY',
    customCycleDays: '',
    nextDate: new Date().toISOString().split('T')[0],
    isExpense: false,
    estimatedAmount: '',
    categoryId: '',
  })

  useEffect(() => {
    // Categories are now handled by CategorySelector
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        customCycleDays: formData.customCycleDays ? parseInt(formData.customCycleDays) : null,
        estimatedAmount: formData.estimatedAmount ? parseFloat(formData.estimatedAmount) : null,
        categoryId: formData.categoryId || null,
      }

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const reminder = await response.json()
        router.push(`/dashboard/reminders/${reminder.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create reminder')
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      alert('Failed to create reminder')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">New Reminder</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Bike Servicing, Car Insurance"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Optional details about this reminder"
              />
            </div>

            {/* Cycle */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.cycle}
                  onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="HALF_YEARLY">Half-Yearly</option>
                  <option value="YEARLY">Yearly</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              {formData.cycle === 'CUSTOM' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Every X Days <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required={formData.cycle === 'CUSTOM'}
                    min="1"
                    value={formData.customCycleDays}
                    onChange={(e) =>
                      setFormData({ ...formData, customCycleDays: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 90"
                  />
                </div>
              )}
            </div>

            {/* Next Date */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Next Due Date <span className="text-red-500">*</span>
              </label>
              <DatePicker
                value={formData.nextDate ? new Date(formData.nextDate) : null}
                onChange={(date) => setFormData({ ...formData, nextDate: date ? date.toISOString().split('T')[0] : '' })}
                placeholder="Select next due date"
              />
            </div>

            {/* Is Expense Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isExpense"
                checked={formData.isExpense}
                onChange={(e) =>
                  setFormData({ ...formData, isExpense: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="isExpense" className="text-sm font-medium">
                This reminder involves expenses
              </label>
            </div>

            {/* Expense Details */}
            {formData.isExpense && (
              <div className="grid gap-4 md:grid-cols-2 pl-7">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estimated Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required={formData.isExpense}
                    min="0"
                    step="0.01"
                    value={formData.estimatedAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedAmount: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <CategorySelector
                    value={formData.categoryId}
                    onChange={(categoryId) => setFormData({ ...formData, categoryId })}
                    onCategoryCreated={() => {
                      // Refresh categories when a new one is created
                      async function refresh() {
                        const response = await fetch('/api/categories')
                        if (response.ok) {
                        await response.json()
                        }
                      }
                      refresh()
                    }}
                    placeholder="Select a category (optional)"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Reminder'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
