import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currency: true },
    })

    return NextResponse.json({ currency: user?.currency || 'INR' })
  } catch (error) {
    console.error('Currency fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch currency' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currency } = await request.json()

    if (!currency || !['INR', 'USD'].includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency. Only INR and USD are supported.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { currency },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Currency update error:', error)
    return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 })
  }
}
