'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle2, Circle, Trash2, Calendar, Tag } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Category {
  id: string
  name: string
  color?: string | null
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
  notes?: string | null
  isFromRecurring: boolean
}

interface PlanItemCardProps {
  item: PlanItem
  onMarkPaid: (id: string) => void
  onDelete: (id: string) => void
}

export default function PlanItemCard({ item, onMarkPaid, onDelete }: PlanItemCardProps) {
  const isOverdue = !item.isPaid && new Date(item.dueDate) < new Date()

  return (
    <Card className={item.isPaid ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Item Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="sm"
                className={`p-0 h-6 w-6 rounded-full ${
                  item.isPaid ? 'text-green-600' : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => !item.isPaid && onMarkPaid(item.id)}
                disabled={item.isPaid}
              >
                {item.isPaid ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Circle className="h-6 w-6" />
                )}
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`font-medium ${
                      item.isPaid ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {item.name}
                  </h3>
                  {item.isFromRecurring && (
                    <Badge variant="secondary" className="text-xs">
                      Recurring
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                  </span>
                  {item.category && (
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.category.color || '#888' }}
                      />
                      {item.category.name}
                    </span>
                  )}
                  {item.isPaid && item.paidOn && (
                    <span className="text-green-600">
                      Paid on {format(new Date(item.paidOn), 'MMM dd')}
                    </span>
                  )}
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Amount & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                ₹{item.amount.toLocaleString('en-IN')}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{item.name}&quot;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(item.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
