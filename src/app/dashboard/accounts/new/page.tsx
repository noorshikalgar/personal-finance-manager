'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DatePicker } from '@/components/ui/DatePicker'

export default function NewAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountType, setAccountType] = useState<'BANK_SALARY' | 'CREDIT_CARD'>('BANK_SALARY')
  
  // Common fields
  const [name, setName] = useState('')
  
  // Bank/Salary fields
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  
  // Recurring Income fields
  const [createRecurring, setCreateRecurring] = useState(false)
  const [recurringNote, setRecurringNote] = useState('Monthly Salary')
  const [recurringFirstDate, setRecurringFirstDate] = useState(() => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(1)
    return nextMonth.toISOString().split('T')[0]
  })
  
  // Credit Card fields
  const [totalLimit, setTotalLimit] = useState('')
  const [availableLimit, setAvailableLimit] = useState('')
  const [billingCycleStart, setBillingCycleStart] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data: any = {
        name,
        type: accountType,
      }

      if (accountType === 'BANK_SALARY') {
        if (!currentBalance) {
          setError('Current balance is required')
          setLoading(false)
          return
        }
        data.currentBalance = currentBalance
        data.monthlyIncome = monthlyIncome || null
        data.startDate = new Date().toISOString()
        
        // Add recurring transaction data if enabled
        if (monthlyIncome && parseFloat(monthlyIncome) > 0 && createRecurring) {
          data.createRecurring = true
          data.recurringNote = recurringNote || 'Monthly Salary'
          data.recurringFirstDate = recurringFirstDate
        }
      } else {
        if (!totalLimit || !availableLimit) {
          setError('Total limit and available limit are required')
          setLoading(false)
          return
        }
        data.totalLimit = totalLimit
        data.availableLimit = availableLimit
        data.billingCycleStart = billingCycleStart ? parseInt(billingCycleStart) : null
        data.dueDate = dueDate ? parseInt(dueDate) : null
      }

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create account')
      }

      const account = await res.json()

      // Redirect to accounts listing page
      router.push('/dashboard/accounts')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard/accounts">
        <Button variant="outline" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Button>
      </Link>

      <div className="bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Add New Account</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAccountType('BANK_SALARY')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  accountType === 'BANK_SALARY'
                    ? 'border-blue-500 bg-card'
                    : 'border-border hover:border-border'
                }`}
              >
                <div className="font-medium">Bank / Salary</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Checking or savings account
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('CREDIT_CARD')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  accountType === 'CREDIT_CARD'
                    ? 'border-blue-500 bg-card'
                    : 'border-border hover:border-border'
                }`}
              >
                <div className="font-medium">Credit Card</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Track credit card spending
                </div>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Account Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Checking, Chase Sapphire"
              className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
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
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
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
                  onChange={(e) => {
                    setMonthlyIncome(e.target.value)
                    // Auto-check recurring if income is entered
                    if (e.target.value && parseFloat(e.target.value) > 0) {
                      setCreateRecurring(true)
                    } else {
                      setCreateRecurring(false)
                    }
                  }}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500 bg-card text-foreground"
                />
              </div>

              {/* Recurring Income Transaction */}
              {monthlyIncome && parseFloat(monthlyIncome) > 0 && (
                <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="createRecurring"
                      checked={createRecurring}
                      onChange={(e) => setCreateRecurring(e.target.checked)}
                      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                    />
                    <label htmlFor="createRecurring" className="text-sm font-semibold text-foreground cursor-pointer">
                      💰 Create recurring income transaction
                    </label>
                  </div>
                  
                  {createRecurring && (
                    <div className="space-y-3 pl-7">
                      <div>
                        <label htmlFor="recurringNote" className="block text-xs font-medium text-muted-foreground mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          id="recurringNote"
                          value={recurringNote}
                          onChange={(e) => setRecurringNote(e.target.value)}
                          placeholder="e.g., Monthly Salary"
                          className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="recurringFirstDate" className="block text-xs font-medium text-muted-foreground mb-1">
                          First Payment Date
                        </label>
                        <DatePicker
                          value={recurringFirstDate ? new Date(recurringFirstDate) : null}
                          onChange={(date) => setRecurringFirstDate(date ? date.toISOString().split('T')[0] : '')}
                          placeholder="Select first payment date"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This will create a monthly recurring income transaction. You can edit or delete it later from the Recurring page.
                      </p>
                    </div>
                  )}
                </div>
              )}
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
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="availableLimit" className="block text-sm font-medium text-foreground">
                  Available Limit *
                </label>
                <input
                  type="number"
                  id="availableLimit"
                  required
                  step="0.01"
                  value={availableLimit}
                  onChange={(e) => setAvailableLimit(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="billingCycleStart" className="block text-sm font-medium text-foreground">
                    Billing Cycle Day (optional)
                  </label>
                  <input
                    type="number"
                    id="billingCycleStart"
                    min="1"
                    max="31"
                    value={billingCycleStart}
                    onChange={(e) => setBillingCycleStart(e.target.value)}
                    placeholder="e.g., 1"
                    className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-foreground">
                    Payment Due Day (optional)
                  </label>
                  <input
                    type="number"
                    id="dueDate"
                    min="1"
                    max="31"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="e.g., 25"
                    className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
            <Link href="/dashboard/accounts" className="flex-1">
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
