import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ hasPin: false })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { pin: true },
    })

    return NextResponse.json({ hasPin: !!user?.pin })
  } catch (error) {
    console.error('Check PIN error:', error)
    return NextResponse.json({ hasPin: false })
  }
}
