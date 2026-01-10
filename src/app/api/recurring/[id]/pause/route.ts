import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = session.user.id
    const body = await request.json()
    const { paused, duration } = body

    // Find the recurring transaction
    const recurring = await prisma.recurringTransaction.findUnique({
      where: { id, userId },
    })

    if (!recurring) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let endDate = recurring.endDate

    // If pausing with duration, calculate temporary end date
    if (paused && duration) {
      const now = new Date()
      if (duration === '1month') {
        endDate = new Date(now.setMonth(now.getMonth() + 1))
      } else if (duration === '2months') {
        endDate = new Date(now.setMonth(now.getMonth() + 2))
      } else if (duration === '3months') {
        endDate = new Date(now.setMonth(now.getMonth() + 3))
      }
    }

    // Update the recurring transaction
    const updated = await prisma.recurringTransaction.update({
      where: { id, userId },
      data: {
        paused,
        ...(endDate && paused ? { endDate } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Pause toggle error:', error)
    return NextResponse.json(
      { error: 'Failed to toggle pause' },
      { status: 500 }
    )
  }
}
