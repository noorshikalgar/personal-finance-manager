'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Circle, 
  AlertCircle,
  ChevronRight 
} from 'lucide-react'
import Link from 'next/link'

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

interface PlannerCardProps {
  planner: PlannerSummary
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function PlannerCard({ planner }: PlannerCardProps) {
  const monthName = MONTHS[planner.month - 1]
  const isComplete = planner.completionPercentage === 100
  const hasOverdue = planner.overdueItems > 0

  return (
    <Link href={`/dashboard/planner/${planner.year}/${planner.month}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {monthName} {planner.year}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {planner.totalItems} {planner.totalItems === 1 ? 'item' : 'items'} planned
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isComplete ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : hasOverdue ? (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {planner.overdueItems} Overdue
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Circle className="h-3 w-3 mr-1" />
                  In Progress
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{planner.completionPercentage}%</span>
            </div>
            <Progress value={planner.completionPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{planner.paidItems} paid</span>
              <span>{planner.unpaidItems} pending</span>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Total Planned</p>
              <p className="text-sm font-semibold">
                ₹{planner.totalPlanned.toLocaleString('en-IN')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
              <p className="text-sm font-semibold text-green-600">
                ₹{planner.totalPaid.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Expected Income & Savings */}
          {planner.expectedIncome > 0 && (
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Expected Income
                </span>
                <span className="font-medium">
                  ₹{planner.expectedIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Projected Savings</span>
                <span className={`font-semibold ${
                  planner.projectedSavings >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{planner.projectedSavings.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* View Details Button */}
          <Button variant="ghost" className="w-full mt-2" size="sm">
            View Details
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
