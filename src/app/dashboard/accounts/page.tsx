import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, CreditCard, Wallet } from 'lucide-react'
import AccountCard from '@/components/accounts/AccountCard'

export default async function AccountsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const accountsRaw = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  // Convert Decimal to number for client components
  const accounts = accountsRaw.map(acc => ({
    ...acc,
    monthlyIncome: acc.monthlyIncome ? Number(acc.monthlyIncome) : null,
    currentBalance: Number(acc.currentBalance),
    totalLimit: acc.totalLimit ? Number(acc.totalLimit) : null,
    availableLimit: acc.availableLimit ? Number(acc.availableLimit) : null,
  }))

  const bankAccounts = accounts.filter(a => a.type === 'BANK_SALARY')
  const creditCards = accounts.filter(a => a.type === 'CREDIT_CARD')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
        <Link href="/dashboard/accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium text-foreground">No accounts yet</h3>
          <p className="mt-1 text-muted-foreground">Get started by creating your first account.</p>
          <div className="mt-6">
            <Link href="/dashboard/accounts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {bankAccounts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <Wallet className="mr-2 h-5 w-5" />
                Bank / Salary Accounts
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bankAccounts.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}

          {creditCards.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Credit Cards
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {creditCards.map((account) => (
                  <AccountCard key={account.id} account={account} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
