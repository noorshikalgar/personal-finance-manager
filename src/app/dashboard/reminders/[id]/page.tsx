'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Edit,
  Trash2,
  DollarSign,
  FileText,
  Upload,
  Download,
  X,
  BarChart3,
} from 'lucide-react'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'

interface Reminder {
  id: string
  title: string
  description: string | null
  cycle: string
  customCycleDays: number | null
  nextDate: string
  lastDate: string | null
  status: string
  isExpenseRelated: boolean
  estimatedCost: number | null
  categoryId: string | null
  category: {
    id: string
    name: string
  } | null
  transactions: Array<{
    id: string
    amount: number
    date: string
    description: string
    category: {
      name: string
    }
  }>
  attachments: Array<{
    id: string
    fileName: string
    fileType: string
    fileSize: number
    uploadedAt: string
  }>
  _count: {
    transactions: number
    attachments: number
  }
}

export default function ReminderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { formatAmount } = useAmountVisibility()
  const [reminderId, setReminderId] = useState<string | null>(null)
  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics' | 'attachments'>('overview')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {

    params.then(p => {
      setReminderId(p.id)
      fetchReminder(p.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchReminder(id: string) {
    try {
      const response = await fetch(`/api/reminders/${id}`)
      if (response.ok) {
        const data = await response.json()
        setReminder(data)
      } else if (response.status === 404) {
        router.push('/dashboard/reminders')
      }
    } catch (error) {
      console.error('Error fetching reminder:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this reminder?')) return
    if (!reminderId) return

    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        router.push('/dashboard/reminders')
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      alert('Failed to delete reminder')
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !reminderId) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/reminders/${reminderId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok && reminderId) {
        fetchReminder(reminderId) // Refresh to show new attachment
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!confirm('Are you sure you want to delete this attachment?')) return
    if (!reminderId) return

    try {
      const response = await fetch(
        `/api/reminders/${reminderId}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      )
      if (response.ok && reminderId) {
        fetchReminder(reminderId) // Refresh
      }
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert('Failed to delete attachment')
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-muted-foreground">Loading reminder...</p>
      </div>
    )
  }

  if (!reminder) {
    return null
  }

  const averageSpent =
    reminder.transactions.length > 0
      ? reminder.transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) / reminder.transactions.length
      : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{reminder.title}</h1>
            <p className="text-muted-foreground">{reminder.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => reminderId && router.push(`/dashboard/reminders/${reminderId}/edit`)}
            disabled={!reminderId}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: 'overview', label: 'Overview', icon: FileText },
          { key: 'transactions', label: 'Transactions', icon: DollarSign },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 },
          { key: 'attachments', label: 'Attachments', icon: Upload },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === key
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {key === 'transactions' && (
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                {reminder._count.transactions}
              </span>
            )}
            {key === 'attachments' && (
              <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                {reminder._count.attachments}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="font-medium">
                  {reminder.cycle === 'CUSTOM'
                    ? `Every ${reminder.customCycleDays} days`
                    : reminder.cycle.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Due Date</p>
                <p className="font-medium">{formatDate(reminder.nextDate)}</p>
              </div>
              {reminder.lastDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Completed</p>
                  <p className="font-medium">{formatDate(reminder.lastDate)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-secondary">
                  {reminder.status}
                </span>
              </div>
            </CardContent>
          </Card>

          {reminder.isExpenseRelated && (
            <Card>
              <CardHeader>
                <CardTitle>Expense Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Amount</p>
                  <p className="text-2xl font-bold">
                    {reminder.estimatedCost ? formatAmount(Number(reminder.estimatedCost)) : formatAmount(0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(reminder.transactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average per Occurrence</p>
                  <p className="font-medium">{formatAmount(averageSpent)}</p>
                </div>
                {reminder.category && (
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <span className="inline-block px-2 py-1 text-xs rounded bg-secondary">
                      {reminder.category.name}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {reminder.transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions linked to this reminder yet.
              </p>
            ) : (
              <div className="space-y-2">
                {reminder.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/transactions`)}
                  >
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)} · {transaction.category.name}
                      </p>
                    </div>
                    <p className="text-lg font-bold">{formatAmount(Math.abs(Number(transaction.amount)))}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardHeader>
            <CardTitle>Spending Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Analytics charts coming soon...
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'attachments' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Attachments</CardTitle>
              <label>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button disabled={uploading} asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {reminder.attachments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attachments yet. Upload bills, receipts, or photos.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {reminder.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{attachment.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(attachment.fileSize)} · {formatDate(attachment.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/api/reminders/${reminderId}/attachments/${attachment.id}`}
                        download
                      >
                        <Button variant="ghost" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
