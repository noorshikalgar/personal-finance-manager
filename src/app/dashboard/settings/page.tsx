import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import SettingsClient from '@/components/settings/SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      createdAt: true,
      updatedAt: true,
      pin: true,
      currency: true,
      theme: true,
      accentColor: true,
    },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Get statistics
  const [accountsCount, transactionsCount, categoriesCount, recurringCount] = await Promise.all([
    prisma.account.count({ where: { userId: session.user.id } }),
    prisma.transaction.count({ where: { userId: session.user.id } }),
    prisma.category.count({ where: { userId: session.user.id } }),
    prisma.recurringTransaction.count({ where: { userId: session.user.id } }),
  ])

  return (
    <SettingsClient
      user={{
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }}
      stats={{
        accounts: accountsCount,
        transactions: transactionsCount,
        categories: categoriesCount,
        recurring: recurringCount,
      }}
    />
  )
}
