'use client'

import Link from 'next/link'
import { CreditCard, Wallet, TrendingUp, Calendar } from 'lucide-react'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'
import type { AccountWithNumbers } from '@/types'

interface AccountCardProps {
  account: AccountWithNumbers
}

export default function AccountCard({ account }: AccountCardProps) {
  const isCreditCard = account.type === 'CREDIT_CARD'
  const { formatAmount } = useAmountVisibility()

  const getCreditUtilization = () => {
    if (!account.totalLimit || !account.availableLimit) return 0
    const used = Number(account.totalLimit) - Number(account.availableLimit)
    return (used / Number(account.totalLimit)) * 100
  }

  return (
    <Link href={`/dashboard/accounts/${account.id}`}>
      <div className="bg-card rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer border border-border h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {isCreditCard ? (
              <CreditCard className="h-6 w-6 text-accent mr-2" />
            ) : (
              <Wallet className="h-6 w-6 text-primary mr-2" />
            )}
            <h3 className="text-lg font-semibold text-card-foreground">{account.name}</h3>
          </div>
        </div>

        {isCreditCard ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-card-foreground">
                {formatAmount(account.availableLimit ? Number(account.availableLimit) : null)}
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Limit:</span>
              <span className="font-medium text-card-foreground">{formatAmount(account.totalLimit ? Number(account.totalLimit) : null)}</span>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Used:</span>
                <span className="font-medium">{getCreditUtilization().toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    getCreditUtilization() > 80 ? 'bg-destructive' : 'bg-primary'
                  }`}
                  style={{ width: `${getCreditUtilization()}%` }}
                />
              </div>
            </div>
            {account.billingCycleStart && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Billing: Day {account.billingCycleStart}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className={`text-2xl font-bold ${Number(account.currentBalance) >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {formatAmount(Number(account.currentBalance))}
              </p>
            </div>
            {account.monthlyIncome && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Monthly Income:
                </span>
                <span className="font-medium text-card-foreground">{formatAmount(Number(account.monthlyIncome))}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
