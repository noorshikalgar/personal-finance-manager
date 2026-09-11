'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, AlertCircle, Calendar } from 'lucide-react'

interface Reminder {
  id: string
  title: string
  nextDate: string
  status: string
  isExpenseRelated: boolean
  estimatedCost: number | null
}

export default function RemindersWidget() {
  const router = useRouter()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUpcomingReminders()
  }, [])

  async function fetchUpcomingReminders() {
    try {
      const response = await fetch('/api/reminders?includeCompleted=false')
      if (response.ok) {
        const data = await response.json()
        // Take first 5 upcoming/overdue reminders
        setReminders(data.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays <= 7) return `In ${diffDays} days`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return null // Silent loading
  }

  if (reminders.length === 0) {
    return null // Don't show widget if no reminders
  }

  const overdueCount = reminders.filter((r) => r.status === 'OVERDUE').length

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <CardTitle className="text-lg font-medium flex flex-wrap items-center gap-2">
          <Bell className="w-5 h-5" />
          Upcoming Reminders
          {overdueCount > 0 && (
            <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 px-2 py-1 rounded-full">
              {overdueCount} overdue
            </span>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/reminders')}
          className="self-start sm:self-auto"
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex justify-between items-start gap-2 p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
              onClick={() => router.push(`/dashboard/reminders/${reminder.id}`)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {reminder.status === 'OVERDUE' && (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                  <p className="font-medium truncate">{reminder.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-3 h-3" />
                  <span
                    className={
                      reminder.status === 'OVERDUE' ? 'text-red-600 dark:text-red-400' : ''
                    }
                  >
                    {formatDate(reminder.nextDate)}
                  </span>
                </div>
              </div>
              {reminder.isExpenseRelated && reminder.estimatedCost && (
                <p className="font-amount text-sm font-medium text-muted-foreground shrink-0">
                  ~${Number(reminder.estimatedCost).toFixed(2)}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
