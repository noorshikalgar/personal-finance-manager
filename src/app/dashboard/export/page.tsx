import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ExportClient from '@/components/export/ExportClient'

export default async function ExportPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return <ExportClient userEmail={session.user.email || ''} />
}
