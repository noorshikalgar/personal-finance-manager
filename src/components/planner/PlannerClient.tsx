'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Calendar, Download, CheckCircle2, Circle } from 'lucide-react'
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

interface PlannerClientProps {
  initialPlan: MonthlyPlan | null
  categories: Category[]
  recurringTransactions: RecurringTransaction[]
  currentMonth: number
  currentYear: number
}

export default function PlannerClient({
  initialPlan,
  categories,
  recurringTransactions,
  currentMonth,
  currentYear,
}: PlannerClientProps) {
  const [plan, setPlan] = useState<MonthlyPlan | null>(initialPlan)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [markAsPaidItem, setMarkAsPaidItem] = useState<PlanItem | null>(null)

  const monthName = format(new Date(currentYear, currentMonth - 1), 'MMMM yyyy')

  // Create initial plan
  const handleCreatePlan = async () => {
    setIsCreatingPlan(true)
    try {
      const response = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
          expectedIncome: 0,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create plan')
      }

      const data = await response.json()
      setPlan(data.plan)
      toast.success('Monthly plan created!')
    } catch (error) {
      console.error('Failed to create plan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create plan')
    } finally {
      setIsCreatingPlan(false)
    }
  }

  // Add new item
  const handleAddItem = async (itemData: {
    name: string
    amount: number
    dueDate: Date
    categoryId?: string
    notes?: string
  }) => {
    if (!plan) return

    try {
      const response = await fetch('/api/planner/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          ...itemData,
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
      toast.success('Item added to plan!')
    } catch (error) {
      console.error('Failed to add item:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add item')
    }
  }

  // Import recurring transactions
  const handleImportRecurring = async (selectedIds: string[]) => {
    if (!plan) return

    try {
      const response = await fetch('/api/planner/import-recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
          recurringTransactionIds: selectedIds,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import transactions')
      }

      const { items } = await response.json()
      setPlan({
        ...plan,
        items: [...plan.items, ...items],
      })
      setIsImportDialogOpen(false)
      toast.success(`Imported ${items.length} item(s)!`)
    } catch (error) {
      console.error('Failed to import:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import')
    }
  }

  // Mark item as paid (opens dialog)
  const handleMarkPaid = async (itemId: string) => {
    if (!plan) return
    const item = plan.items.find((i) => i.id === itemId)
    if (item) {
      setMarkAsPaidItem(item)
    }
  }

  // Refresh plan after marking as paid
  const refreshPlan = async () => {
    if (!plan) return

    try {
      const response = await fetch(`/api/planner?month=${plan.month}&year=${plan.year}`)
      if (response.ok) {
        const updatedPlan = await response.json()
        setPlan(updatedPlan)
      }
    } catch (error) {
      console.error('Failed to refresh plan:', error)
    }
  }

  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!plan) return

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
      toast.success('Item deleted')
    } catch (error) {
      console.error('Failed to delete:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete item')
    }
  }

  // Update expected income
  const handleUpdateIncome = async (newIncome: number) => {
    if (!plan) return

    try {
      const response = await fetch(`/api/planner?month=${plan.month}&year=${plan.year}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedIncome: newIncome }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update income')
      }

      setPlan({ ...plan, expectedIncome: newIncome })
      toast.success('Expected income updated!')
    } catch (error) {
      console.error('Failed to update income:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update')
    }
  }

  // No plan exists yet
  if (!plan) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monthly Planner</h1>
          <p className="text-muted-foreground mt-1">
            Plan and track your monthly expenses
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>No Plan for {monthName}</CardTitle>
            <CardDescription>
              Create a plan to start tracking your monthly expenses and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreatePlan} disabled={isCreatingPlan}>
              <Calendar className="mr-2 h-4 w-4" />
              {isCreatingPlan ? 'Creating...' : 'Create Plan for This Month'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const unpaidItems = plan.items.filter((item) => !item.isPaid)
  const paidItems = plan.items.filter((item) => item.isPaid)
  const totalPlanned = plan.items.reduce((sum, item) => sum + item.amount, 0)
  const totalPaid = paidItems.reduce((sum, item) => sum + item.amount, 0)
  const totalRemaining = unpaidItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Monthly Planner</h1>
          <p className="text-muted-foreground mt-1">{monthName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            disabled={recurringTransactions.length === 0}
            className="flex-1 sm:flex-none"
          >
            <Download className="mr-2 h-4 w-4" />
            Import Recurring
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Summary */}
      <PlannerSummary
        expectedIncome={plan.expectedIncome}
        totalPlanned={totalPlanned}
        totalPaid={totalPaid}
        totalRemaining={totalRemaining}
        unpaidCount={unpaidItems.length}
        paidCount={paidItems.length}
        onUpdateIncome={handleUpdateIncome}
      />

      {/* Items List */}
      <div className="space-y-4">
        {/* Unpaid Items */}
        {unpaidItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <Circle className="mr-2 h-5 w-5 text-yellow-500" />
              Unpaid ({unpaidItems.length})
            </h2>
            <div className="grid gap-3">
              {unpaidItems.map((item) => (
                <PlanItemCard
                  key={item.id}
                  item={item}
                  onMarkPaid={handleMarkPaid}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          </div>
        )}

        {/* Paid Items */}
        {paidItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              Paid ({paidItems.length})
            </h2>
            <div className="grid gap-3">
              {paidItems.map((item) => (
                <PlanItemCard
                  key={item.id}
                  item={item}
                  onMarkPaid={handleMarkPaid}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {plan.items.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No items in your plan yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Add items manually or import from your recurring transactions
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                  {recurringTransactions.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setIsImportDialogOpen(true)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Import Recurring
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
