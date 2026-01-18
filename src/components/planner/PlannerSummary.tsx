'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, Edit2, Check, X } from 'lucide-react'

interface PlannerSummaryProps {
  expectedIncome: number
  totalPlanned: number
  totalPaid: number
  totalRemaining: number
  unpaidCount: number
  paidCount: number
  onUpdateIncome: (newIncome: number) => void
}

export default function PlannerSummary({
  expectedIncome,
  totalPlanned,
  totalRemaining,
  unpaidCount,
  paidCount,
  onUpdateIncome,
}: PlannerSummaryProps) {
  const [isEditingIncome, setIsEditingIncome] = useState(false)
  const [incomeInput, setIncomeInput] = useState(expectedIncome.toString())

  const projectedSavings = expectedIncome - totalPlanned
  const savingsRate = expectedIncome > 0 ? (projectedSavings / expectedIncome) * 100 : 0

  const handleSaveIncome = () => {
    const newIncome = parseFloat(incomeInput) || 0
    onUpdateIncome(newIncome)
    setIsEditingIncome(false)
  }

  const handleCancelEdit = () => {
    setIncomeInput(expectedIncome.toString())
    setIsEditingIncome(false)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Expected Income */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Expected Income
              </span>
            </div>
            {!isEditingIncome && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsEditingIncome(true)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {isEditingIncome ? (
            <div className="space-y-2">
              <Input
                type="number"
                value={incomeInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncomeInput(e.target.value)}
                className="h-8"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveIncome} className="flex-1">
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-foreground">
              ₹{expectedIncome.toLocaleString('en-IN')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total Planned */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Total Planned
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ₹{totalPlanned.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {unpaidCount + paidCount} items total
          </p>
        </CardContent>
      </Card>

      {/* Remaining */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Remaining
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ₹{totalRemaining.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {unpaidCount} unpaid {unpaidCount === 1 ? 'item' : 'items'}
          </p>
        </CardContent>
      </Card>

      {/* Projected Savings */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <PiggyBank className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Projected Savings
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              projectedSavings >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ₹{projectedSavings.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {savingsRate.toFixed(1)}% savings rate
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
