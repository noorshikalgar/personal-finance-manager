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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Category {
  id: string
  name: string
  color?: string | null
}

interface RecurringTransaction {
  id: string
  amount: number
  note?: string | null
  type: string
  dayOfMonth: number
  categoryId?: string | null
  category?: Category | null
  linkedToAccountIncome: boolean
}

interface ImportRecurringDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (selectedIds: string[]) => void
  recurringTransactions: RecurringTransaction[]
  currentMonth: number
  currentYear: number
}

export default function ImportRecurringDialog({
  open,
  onOpenChange,
  onImport,
  recurringTransactions,
  currentMonth,
  currentYear,
}: ImportRecurringDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === recurringTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(recurringTransactions.map((t) => t.id)))
    }
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return

    setIsSubmitting(true)
    try {
      await onImport(Array.from(selectedIds))
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Failed to import:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Recurring Transactions</DialogTitle>
          <DialogDescription>
            Select recurring transactions to add to your monthly plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {recurringTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recurring transactions found
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between pb-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-sm"
                >
                  {selectedIds.size === recurringTransactions.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
              </div>

              {/* List */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {recurringTransactions.map((transaction) => {
                    const isSelected = selectedIds.has(transaction.id)
                    return (
                      <div
                        key={transaction.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleToggle(transaction.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(transaction.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">
                              {transaction.note || 'Recurring Transaction'}
                            </span>
                            {transaction.linkedToAccountIncome && (
                              <Badge variant="secondary" className="text-xs">
                                Income
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>Due on {currentMonth}/{transaction.dayOfMonth}/{currentYear}</span>
                            {transaction.category && (
                              <span className="ml-2">• {transaction.category.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-foreground">
                            ₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.type === 'INCOME' ? 'Income' : 'Expense'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.size === 0}
          >
            {isSubmitting
              ? 'Importing...'
              : `Import ${selectedIds.size} ${selectedIds.size === 1 ? 'Item' : 'Items'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
