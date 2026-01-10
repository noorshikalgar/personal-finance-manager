import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardNav from '@/components/dashboard/DashboardNav'
import { OnboardingCheck } from '@/components/onboarding/OnboardingCheck'
import { AmountVisibilityProvider } from '@/contexts/AmountVisibilityContext'
import { syncOnboardingProgress } from '@/lib/onboarding'
import { Toaster } from 'sonner'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // Fetch user to check onboarding status
  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Always sync onboarding progress with actual data
  await syncOnboardingProgress(session.user.id)

  // Refresh user data after sync - use raw query to bypass Prisma cache and connection pool issues
  const refreshedUser = await prisma.$queryRaw<any>`
    SELECT * FROM "User" WHERE id = ${session.user.id}
  `
  user = refreshedUser?.[0] || user

  if (user) {
    console.log('📊 Dashboard layout - User onboarding status:', {
      onboardingCompleted: user.onboardingCompleted,
      onboardingSkipped: user.onboardingSkipped,
    })
  }

  // Get counts for wizard
  const [accountCount, transactionCount, categoryCount] = await Promise.all([
    prisma.account.count({ where: { userId: session.user.id } }),
    prisma.transaction.count({ where: { userId: session.user.id } }),
    prisma.category.count({ where: { userId: session.user.id } }),
  ])

  return (
    <AmountVisibilityProvider>
      <div className="min-h-screen bg-background">
        {/* Global onboarding wizard - shows on all dashboard pages */}
        {user && (
          <OnboardingCheck
            userId={session.user.id}
            onboardingCompleted={user.onboardingCompleted}
            onboardingSkipped={user.onboardingSkipped}
            accountCount={accountCount}
            transactionCount={transactionCount}
            categoryCount={categoryCount}
          />
        )}
        <DashboardNav userEmail={session.user?.email || ''} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Toaster position="top-center" />
      </div>
    </AmountVisibilityProvider>
  )
}
