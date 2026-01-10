import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, Wallet, TrendingUp, TrendingDown } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AccountDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const { id } = await params

  const accountRaw = await prisma.account.findUnique({
    where: { 
      id,
      userId: session.user.id,
    },
    include: {
      transactions: {
        orderBy: { date: 'desc' },
        take: 50,
        include: {
          category: true,
        },
      },
    },
  })

  if (!accountRaw) {
    notFound()
  }

  // Convert Decimal to number
  const account = {
    ...accountRaw,
    monthlyIncome: accountRaw.monthlyIncome ? Number(accountRaw.monthlyIncome) : null,
    currentBalance: Number(accountRaw.currentBalance),
    totalLimit: accountRaw.totalLimit ? Number(accountRaw.totalLimit) : null,
    availableLimit: accountRaw.availableLimit ? Number(accountRaw.availableLimit) : null,
    transactions: accountRaw.transactions.map(txn => ({
      ...txn,
      amount: Number(txn.amount),
      category: txn.category ? {
        ...txn.category,
        monthlyBudget: txn.category.monthlyBudget ? Number(txn.category.monthlyBudget) : null,
      } : null,
    })),
  }

  const isCreditCard = account.type === 'CREDIT_CARD'

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  const getCreditUtilization = () => {
    if (!account.totalLimit || !account.availableLimit) return 0
    const used = account.totalLimit - account.availableLimit
    return (used / account.totalLimit) * 100
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/accounts">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">{account.name}</h1>
      </div>

      {/* Account Summary Card */}
      <div className="bg-card rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {isCreditCard ? (
              <CreditCard className="h-8 w-8 text-primary" />
            ) : (
              <Wallet className="h-8 w-8 text-accent" />
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground">{account.name}</h2>
              <p className="text-sm text-muted-foreground">
                {isCreditCard ? 'Credit Card' : 'Bank Account'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(account.currentBalance)}
            </p>
          </div>

          {!isCreditCard && account.monthlyIncome && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
              <p className="text-2xl font-bold text-accent">
                {formatCurrency(account.monthlyIncome)}
              </p>
            </div>
          )}

          {isCreditCard && (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Limit</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(account.totalLimit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Limit</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(account.availableLimit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Utilization</p>
                <p className="text-2xl font-bold text-foreground">
                  {getCreditUtilization().toFixed(1)}%
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      getCreditUtilization() > 70 ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(getCreditUtilization(), 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {isCreditCard && account.billingCycleStart && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
              <p className="text-lg font-semibold text-foreground">
                Day {account.billingCycleStart}
              </p>
            </div>
          )}

          {isCreditCard && account.dueDate && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Due Date</p>
              <p className="text-lg font-semibold text-foreground">
                Day {account.dueDate}
              </p>
            </div>
          )}
        </div>

        {account.startDate && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Account started: {formatDate(account.startDate)}
            </p>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Recent Transactions</h2>
        </div>
        
        {account.transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No transactions yet for this account.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {account.transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-secondary transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === 'INCOME'
                          ? 'bg-accent/10'
                          : 'bg-destructive/10'
                      }`}
                    >
                      {transaction.type === 'INCOME' ? (
                        <TrendingUp className="h-4 w-4 text-accent" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.note || 'No description'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                        {transaction.category && (
                          <>
                            <span className="text-border">•</span>
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: (transaction.category.color || '#gray') + '20',
                                color: transaction.category.color || '#gray',
                              }}
                            >
                              {transaction.category.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p
                    className={`text-lg font-semibold ${
                      transaction.type === 'INCOME'
                        ? 'text-accent'
                        : 'text-destructive'
                    }`}
                  >
                    {transaction.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
