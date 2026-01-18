'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Account {
  id: string
  name: string
  type: string
  balance: number
}

interface PlanItem {
  id: string
  name: string
  amount: number
  dueDate: Date
}

interface MarkAsPaidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PlanItem | null
  onSuccess: () => void
}

export default function MarkAsPaidDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: MarkAsPaidDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [checkingTransaction, setCheckingTransaction] = useState(true)
  const [existingTransaction, setExistingTransaction] = useState<boolean>(false)

  // Fetch accounts when dialog opens
  useEffect(() => {
    if (open && item) {
      fetchAccounts()
      checkExistingTransaction()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (!response.ok) throw new Error('Failed to fetch accounts')
      const data = await response.json()
      setAccounts(data)
      // Auto-select first account
      if (data.length > 0) {
        setSelectedAccount(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      toast.error('Failed to load accounts')
    }
  }

  const checkExistingTransaction = async () => {
    if (!item) return

    setCheckingTransaction(true)
    try {
      const startOfDay = new Date(item.dueDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(item.dueDate)
      endOfDay.setHours(23, 59, 59, 999)

      const response = await fetch(
        `/api/transactions?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}&amount=${Math.abs(item.amount)}&type=EXPENSE`
      )

      if (response.ok) {
        const transactions = await response.json()
        setExistingTransaction(transactions.length > 0)
      }
    } catch (error) {
      console.error('Failed to check transactions:', error)
    } finally {
      setCheckingTransaction(false)
    }
  }

  const handleMarkPaid = async (createTransaction: boolean) => {
    if (!item) return

    setLoading(true)
    try {
      const body: { createTransaction?: boolean; accountId?: string } = {}
      
      if (createTransaction) {
        if (!selectedAccount) {
          toast.error('Please select an account')
          setLoading(false)
          return
        }
        body.createTransaction = true
        body.accountId = selectedAccount
      }

      const response = await fetch(`/api/planner/items/${item.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark as paid')
      }

      const data = await response.json()
      
      if (data.linkedExisting) {
        toast.success('Marked as paid and linked to existing transaction!')
      } else if (data.transactionCreated) {
        toast.success('Marked as paid and transaction created!')
      } else {
        toast.success('Marked as paid!')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to mark as paid:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark as paid')
    } finally {
      setLoading(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark as Paid</DialogTitle>
          <DialogDescription>
            Mark &quot;{item.name}&quot; as paid ({Math.abs(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Check */}
          {checkingTransaction ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking for existing transactions...
            </div>
          ) : existingTransaction ? (
            <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Matching transaction found!
                </p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  A transaction with the same amount exists on this date. It will be automatically linked.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  No matching transaction found
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Would you like to create a transaction for this payment?
                </p>
              </div>
            </div>
          )}

          {/* Account Selection (only if no existing transaction) */}
          {!checkingTransaction && !existingTransaction && (
            <div className="space-y-2">
              <Label htmlFor="account">Select Account (Optional)</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Choose an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type}) - {account.balance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!checkingTransaction && !existingTransaction ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleMarkPaid(false)}
                disabled={loading}
              >
                Just Mark as Paid
              </Button>
              <Button
                onClick={() => handleMarkPaid(true)}
                disabled={loading || !selectedAccount}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark Paid & Create Transaction
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={() => handleMarkPaid(false)} disabled={loading || checkingTransaction}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {checkingTransaction ? 'Checking...' : 'Mark as Paid'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
