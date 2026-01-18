'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Download, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import AddItemDialog from './AddItemDialog'
import ImportRecurringDialog from './ImportRecurringDialog'
import PlanItemCard from './PlanItemCard'
import PlannerSummary from './PlannerSummary'
import MarkAsPaidDialog from './MarkAsPaidDialog'

interface Category {
  id: string
  name: string
  color?: string | null
  monthlyBudget?: number | null
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

interface PlanItem {
  id: string
  name: string
  amount: number
  dueDate: Date
  isPaid: boolean
  paidOn?: Date | null
  categoryId?: string | null
  category?: Category | null
  transactionId?: string | null
  isFromRecurring: boolean
  notes?: string | null
}

interface MonthlyPlan {
  id: string
  month: number
  year: number
  expectedIncome: number
  items: PlanItem[]
  createdAt: Date
  updatedAt: Date
}

interface PlannerDetailClientProps {
  initialPlan: MonthlyPlan
  categories: Category[]
  recurringTransactions: RecurringTransaction[]
  currentMonth: number
  currentYear: number
}

export default function PlannerDetailClient({
  initialPlan,
  categories,
  recurringTransactions,
  currentMonth,
  currentYear,
}: PlannerDetailClientProps) {
  const router = useRouter()
  const [plan, setPlan] = useState<MonthlyPlan>(initialPlan)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [markAsPaidItem, setMarkAsPaidItem] = useState<PlanItem | null>(null)

  const monthName = format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy')

  // Add new item
  const handleAddItem = async (data: {
    name: string
    amount: number
    dueDate: Date
    categoryId?: string
    notes?: string
  }) => {
    try {
      const response = await fetch('/api/planner/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          ...data,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add item')
      }

      const newItem = await response.json()
      setPlan({
        ...plan,
        items: [...plan.items, newItem],
      })
      setIsAddDialogOpen(false)
      toast.success('Item added!')
    } catch (error) {
      console.error('Failed to add item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add item')
    }
  }

  // Import recurring transactions
  const handleImportRecurring = async (selectedIds: string[]) => {
    try {
      const items = selectedIds.map(id => ({ recurringTransactionId: id }))
      
      const response = await fetch('/api/planner/import-recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          items,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import')
      }

      const importedItems = await response.json()
      setPlan({
        ...plan,
        items: [...plan.items, ...importedItems],
      })
      setIsImportDialogOpen(false)
      toast.success(`Imported ${selectedIds.length} item(s)!`)
    } catch (error) {
      console.error('Failed to import:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import')
    }
  }

  // Mark item as paid (opens dialog)
  const handleMarkPaid = async (itemId: string) => {
    const item = plan.items.find((i) => i.id === itemId)
    if (item) {
      setMarkAsPaidItem(item)
    }
  }

  // Refresh plan after marking as paid
  const refreshPlan = async () => {
    try {
      const response = await fetch(`/api/planner?month=${plan.month}&year=${plan.year}`)
      if (response.ok) {
        const data = await response.json()
        if (data.plan) {
          setPlan(data.plan)
        }
      }
    } catch (error) {
      console.error('Failed to refresh plan:', error)
    }
  }

  // Update expected income
  const handleUpdateIncome = async (newIncome: number) => {
    try {
      const response = await fetch(`/api/planner/${plan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expectedIncome: newIncome,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update income')
      }

      setPlan({
        ...plan,
        expectedIncome: newIncome,
      })
      toast.success('Expected income updated!')
    } catch (error) {
      console.error('Failed to update income:', error)
      toast.error('Failed to update income')
    }
  }

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/planner/items/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete item')
      }

      setPlan({
        ...plan,
        items: plan.items.filter((item) => item.id !== itemId),
      })
      toast.success('Item deleted!')
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete item')
    }
  }

  const unpaidItems = plan.items.filter((item) => !item.isPaid)
  const paidItems = plan.items.filter((item) => item.isPaid)

  const totalPlanned = plan.items.reduce((sum, item) => sum + item.amount, 0)
  const totalPaid = paidItems.reduce((sum, item) => sum + item.amount, 0)
  const totalRemaining = unpaidItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/planner')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            {monthName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Plan and track your monthly expenses
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <PlannerSummary
        expectedIncome={plan.expectedIncome}
        totalPlanned={totalPlanned}
        totalPaid={totalPaid}
        totalRemaining={totalRemaining}
        unpaidCount={unpaidItems.length}
        paidCount={paidItems.length}
        onUpdateIncome={handleUpdateIncome}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
        <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Import Recurring
        </Button>
      </div>

      {/* Items List */}
      {plan.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground mb-6">
              Add items to start planning your month
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Import Recurring
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unpaid Items */}
          {unpaidItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Pending ({unpaidItems.length})
                </CardTitle>
                <CardDescription>Items that need to be paid</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {unpaidItems.map((item) => (
                  <PlanItemCard
                    key={item.id}
                    item={item}
                    onMarkPaid={handleMarkPaid}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Paid Items */}
          {paidItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Completed ({paidItems.length})
                </CardTitle>
                <CardDescription>Items that have been paid</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {paidItems.map((item) => (
                  <PlanItemCard
                    key={item.id}
                    item={item}
                    onMarkPaid={handleMarkPaid}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialogs */}
      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddItem}
        categories={categories}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
      <ImportRecurringDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImportRecurring}
        recurringTransactions={recurringTransactions}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />
      <MarkAsPaidDialog
        open={!!markAsPaidItem}
        onOpenChange={(open) => !open && setMarkAsPaidItem(null)}
        item={markAsPaidItem}
        onSuccess={refreshPlan}
      />
    </div>
  )
}
