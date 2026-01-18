'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Calendar, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface CreatePlannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (month: number, year: number) => void
  existingPlanners: Array<{ month: number; year: number }>
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CreatePlannerDialog({
  open,
  onOpenChange,
  onSuccess,
  existingPlanners,
}: CreatePlannerDialogProps) {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // 1-12
  const currentYear = now.getFullYear()

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [expectedIncome, setExpectedIncome] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Check if planner already exists
  const plannerExists = existingPlanners.some(
    (p) => p.month === selectedMonth && p.year === selectedYear
  )

  // Generate year options (current year ± 2)
  const yearOptions = Array.from(
    { length: 5 },
    (_, i) => currentYear - 2 + i
  )

  const handleCreate = async () => {
    if (plannerExists) {
      toast.error('A planner for this month already exists')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          expectedIncome: expectedIncome ? parseFloat(expectedIncome) : 0,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create planner')
      }

      toast.success(`Planner for ${MONTHS[selectedMonth - 1]} ${selectedYear} created!`)
      onSuccess(selectedMonth, selectedYear)
      onOpenChange(false)
      
      // Reset form
      setSelectedMonth(currentMonth)
      setSelectedYear(currentYear)
      setExpectedIncome('')
    } catch (error) {
      console.error('Failed to create planner:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create planner')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSelect = (type: 'current' | 'next') => {
    if (type === 'current') {
      setSelectedMonth(currentMonth)
      setSelectedYear(currentYear)
    } else {
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
      setSelectedMonth(nextMonth)
      setSelectedYear(nextYear)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Planner
          </DialogTitle>
          <DialogDescription>
            Select the month and year for your new monthly planner
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Select Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect('current')}
              className="flex-1"
            >
              This Month
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickSelect('next')}
              className="flex-1"
            >
              Next Month
            </Button>
          </div>

          {/* Month Selection */}
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selection */}
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expected Income */}
          <div className="space-y-2">
            <Label htmlFor="expectedIncome" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Expected Income (Optional)
            </Label>
            <Input
              id="expectedIncome"
              type="number"
              placeholder="0"
              value={expectedIncome}
              onChange={(e) => setExpectedIncome(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          {/* Warning if planner exists */}
          {plannerExists && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                ⚠️ A planner for {MONTHS[selectedMonth - 1]} {selectedYear} already exists
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || plannerExists}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Planner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
