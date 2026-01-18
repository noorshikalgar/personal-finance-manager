'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Calendar } from 'lucide-react'
import PlannerCard from './PlannerCard'
import CreatePlannerDialog from './CreatePlannerDialog'

interface PlannerSummary {
  id: string
  month: number
  year: number
  expectedIncome: number
  totalItems: number
  paidItems: number
  unpaidItems: number
  overdueItems: number
  totalPlanned: number
  totalPaid: number
  totalRemaining: number
  completionPercentage: number
  projectedSavings: number
  createdAt: Date
  updatedAt: Date
}

interface PlannerListClientProps {
  planners: PlannerSummary[]
}

export default function PlannerListClient({ planners: initialPlanners }: PlannerListClientProps) {
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const planners = initialPlanners

  const handleCreateSuccess = (month: number, year: number) => {
    // Navigate to the newly created planner
    router.push(`/dashboard/planner/${year}/${month}`)
  }

  const existingPlanners = planners.map((p) => ({
    month: p.month,
    year: p.year,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Monthly Planners
          </h1>
          <p className="text-muted-foreground mt-1">
            Plan and track your monthly expenses
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Planner
        </Button>
      </div>

      {/* Planners Grid */}
      {planners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No planners yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Create your first monthly planner to start organizing your expenses and tracking your budget.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Planner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {planners.map((planner) => (
            <PlannerCard key={planner.id} planner={planner} />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreatePlannerDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        existingPlanners={existingPlanners}
      />
    </div>
  )
}
