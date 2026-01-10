import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import { AmountVisibilityProvider } from '@/contexts/AmountVisibilityContext'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <AmountVisibilityProvider>
      <div className="min-h-screen bg-background">
        <DashboardNav userEmail={session.user?.email || ''} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </AmountVisibilityProvider>
  )
}
