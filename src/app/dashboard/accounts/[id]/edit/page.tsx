'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function EditAccountPage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [totalLimit, setTotalLimit] = useState('')
  const [availableLimit, setAvailableLimit] = useState('')
  const [billingCycleStart, setBillingCycleStart] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [accountType, setAccountType] = useState<'BANK_SALARY' | 'CREDIT_CARD'>('BANK_SALARY')
  const [hasLinkedRecurring, setHasLinkedRecurring] = useState(false)

  useEffect(() => {
    fetchAccount()
  }, [accountId])

  const fetchAccount = async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}`)
      if (!res.ok) throw new Error('Failed to fetch account')

      const account = await res.json()
      setName(account.name)
      setAccountType(account.type)
      setCurrentBalance(account.currentBalance?.toString() || '')
      setMonthlyIncome(account.monthlyIncome?.toString() || '')
      setTotalLimit(account.totalLimit?.toString() || '')
      setAvailableLimit(account.availableLimit?.toString() || '')
      setBillingCycleStart(account.billingCycleStart?.toString() || '')
      setDueDate(account.dueDate?.toString() || '')

      // Check for linked recurring transaction
      const recurringRes = await fetch(`/api/recurring?accountId=${accountId}&linkedToAccountIncome=true`)
      if (recurringRes.ok) {
        const data = await recurringRes.json()
        setHasLinkedRecurring(data.recurringTransactions?.length > 0)
      }
    } catch (err) {
      setError('Failed to load account')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const data: any = {
        name,
        type: accountType,
      }

      if (accountType === 'BANK_SALARY') {
        if (!currentBalance) {
          setError('Current balance is required')
          setSubmitting(false)
          return
        }
        data.currentBalance = parseFloat(currentBalance)
        data.monthlyIncome = monthlyIncome ? parseFloat(monthlyIncome) : null
      } else {
        if (!totalLimit || !availableLimit) {
          setError('Total limit and available limit are required')
          setSubmitting(false)
          return
        }
        data.totalLimit = parseFloat(totalLimit)
        data.availableLimit = parseFloat(availableLimit)
        data.billingCycleStart = billingCycleStart ? parseInt(billingCycleStart) : null
        data.dueDate = dueDate ? parseInt(dueDate) : null
      }

      const res = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update account')
      }

      toast.success('Account updated successfully')
      router.push(`/dashboard/accounts/${accountId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      toast.error(err.message || 'Failed to update account')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/dashboard/accounts/${accountId}`}>
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Account
        </Button>
      </Link>

      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Edit Account</h1>

        {/* Warning for linked recurring */}
        {hasLinkedRecurring && accountType === 'BANK_SALARY' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Recurring Income Transaction Linked
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  This account has an active recurring transaction linked to the monthly income. To change the recurring amount or schedule:
                </p>
                <Link href="/dashboard/recurring">
                  <Button size="sm" variant="outline" className="text-xs">
                    Edit Recurring Transaction →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Account Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Checking, Chase Sapphire"
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
            />
          </div>

          {accountType === 'BANK_SALARY' ? (
            <>
              <div>
                <label htmlFor="currentBalance" className="block text-sm font-medium text-foreground">
                  Current Balance *
                </label>
                <input
                  type="number"
                  id="currentBalance"
                  required
                  step="0.01"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="monthlyIncome" className="block text-sm font-medium text-foreground">
                  Monthly Income (optional)
                </label>
                <input
                  type="number"
                  id="monthlyIncome"
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  For reference only. Update the recurring transaction separately if needed.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="totalLimit" className="block text-sm font-medium text-foreground">
                  Total Credit Limit *
                </label>
                <input
                  type="number"
                  id="totalLimit"
                  required
                  step="0.01"
                  value={totalLimit}
                  onChange={(e) => setTotalLimit(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="availableLimit" className="block text-sm font-medium text-foreground">
                  Available Credit *
                </label>
                <input
                  type="number"
                  id="availableLimit"
                  required
                  step="0.01"
                  value={availableLimit}
                  onChange={(e) => setAvailableLimit(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="billingCycleStart" className="block text-sm font-medium text-foreground">
                    Billing Cycle Start Day
                  </label>
                  <input
                    type="number"
                    id="billingCycleStart"
                    min="1"
                    max="31"
                    value={billingCycleStart}
                    onChange={(e) => setBillingCycleStart(e.target.value)}
                    placeholder="1-31"
                    className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-foreground">
                    Payment Due Day
                  </label>
                  <input
                    type="number"
                    id="dueDate"
                    min="1"
                    max="31"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="1-31"
                    className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-card text-foreground focus:outline-none focus:ring-primary focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href={`/dashboard/accounts/${accountId}`} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
