'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/DatePicker'
import CategorySelector from '@/components/categories/CategorySelector'

interface Category {
  id: string
  name: string
}

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (data: {
    name: string
    amount: number
    dueDate: Date
    categoryId?: string
    notes?: string
  }) => void
  categories: Category[]
  currentMonth: number
  currentYear: number
}

export default function AddItemDialog({
  open,
  onOpenChange,
  onAdd,
  categories,
  currentMonth,
  currentYear,
}: AddItemDialogProps) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [categoryId, setCategoryId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate min and max dates for the current month
  const minDate = new Date(currentYear, currentMonth - 1, 1)
  const maxDate = new Date(currentYear, currentMonth, 0) // Last day of the month

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount || !dueDate) return

    setIsSubmitting(true)
    try {
      await onAdd({
        name,
        amount: parseFloat(amount),
        dueDate,
        categoryId: categoryId || undefined,
        notes: notes || undefined,
      })
      // Reset form
      setName('')
      setAmount('')
      setDueDate(null)
      setCategoryId('')
      setNotes('')
    } catch (error) {
      console.error('Failed to add item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Plan Item</DialogTitle>
          <DialogDescription>
            Add a new expense or payment to your monthly plan
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Rent, Internet Bill, Groceries"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                required
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Select date"
                minDate={minDate}
                maxDate={maxDate}
                defaultMonth={minDate}
                className="mt-1"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <CategorySelector
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select category (optional)"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional details..."
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !amount || !dueDate}>
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
