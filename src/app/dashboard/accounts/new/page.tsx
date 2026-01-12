'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

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
  const [importPast, setImportPast] = useState<boolean | null>(null)
  
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
            <div className="bg-card border border-border text-muted-foreground px-4 py-3 rounded">
              {error}
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
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-blue-500"
                />
              </div>

              <div className="bg-card border border-border rounded-md p-4">
                <p className="text-sm font-medium text-foreground mb-2">
                  Do you want to import past transactions?
                </p>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importPast"
                      checked={importPast === true}
                      onChange={() => setImportPast(true)}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">
                      Yes - I&apos;ll add them manually
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importPast"
                      checked={importPast === false}
                      onChange={() => setImportPast(false)}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">
                      No - Start tracking from today
                    </span>
                  </label>
                </div>
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
