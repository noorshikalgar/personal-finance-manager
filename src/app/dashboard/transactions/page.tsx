import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import TransactionsClient from '@/components/transactions/TransactionsClient'

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
      </div>
      <TransactionsClient />
    </div>
  )
}
