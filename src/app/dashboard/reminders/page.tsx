'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Bell, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'

interface Reminder {
  id: string
  title: string
  description: string | null
  cycle: string
  nextDate: string
  status: string
  isExpenseRelated: boolean
  estimatedCost: number | null
  categoryId: string | null
  category: {
    id: string
    name: string
  } | null
  _count: {
    transactions: number
    attachments: number
  }
}

export default function RemindersPage() {
  const router = useRouter()
  const { formatAmount } = useAmountVisibility()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue'>('all')

  useEffect(() => {
    fetchReminders()
  }, [])

  async function fetchReminders() {
    try {
      const response = await fetch('/api/reminders')
      if (response.ok) {
        const data = await response.json()
        setReminders(data)
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReminders = reminders.filter((reminder) => {
    if (filter === 'upcoming') return reminder.status === 'UPCOMING'
    if (filter === 'overdue') return reminder.status === 'OVERDUE'
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
      case 'UPCOMING':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
      case 'SNOOZED':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
      case 'COMPLETED':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    }
  }

  const formatCycle = (cycle: string, customDays?: number | null) => {
    if (cycle === 'CUSTOM' && customDays) {
      return `Every ${customDays} days`
    }
    return cycle.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-muted-foreground">Loading reminders...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Reminders
          </h1>
          <p className="text-muted-foreground mt-1">
            Track recurring expenses, maintenance, and important dates
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/reminders/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Reminder
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({reminders.length})
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setFilter('upcoming')}
          size="sm"
        >
          Upcoming ({reminders.filter((r) => r.status === 'UPCOMING').length})
        </Button>
        <Button
          variant={filter === 'overdue' ? 'default' : 'outline'}
          onClick={() => setFilter('overdue')}
          size="sm"
        >
          Overdue ({reminders.filter((r) => r.status === 'OVERDUE').length})
        </Button>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {filter === 'all'
                ? 'No reminders yet. Create your first reminder to get started!'
                : `No ${filter} reminders.`}
            </p>
            {filter === 'all' && (
              <Button onClick={() => router.push('/dashboard/reminders/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Reminder
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredReminders.map((reminder) => (
            <Card
              key={reminder.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/reminders/${reminder.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{reminder.title}</CardTitle>
                  {reminder.status === 'OVERDUE' && (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full w-fit ${getStatusColor(
                    reminder.status
                  )}`}
                >
                  {reminder.status}
                </span>
              </CardHeader>
              <CardContent>
                {reminder.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {reminder.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Next: {formatDate(reminder.nextDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bell className="w-4 h-4" />
                    <span>{formatCycle(reminder.cycle)}</span>
                  </div>

                  {reminder.isExpenseRelated && reminder.estimatedCost && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>~{formatAmount(Number(reminder.estimatedCost))}</span>
                    </div>
                  )}

                  {reminder.category && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs px-2 py-1 bg-secondary rounded">
                        {reminder.category.name}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {reminder._count.transactions} transactions
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {reminder._count.attachments} files
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
