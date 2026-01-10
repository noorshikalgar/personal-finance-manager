import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { pin } = body

    if (!pin || pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { error: 'PIN must be 4-6 digits' },
        { status: 400 }
      )
    }

    // Hash the PIN before storing
    const hashedPin = await bcrypt.hash(pin, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { pin: hashedPin },
    })

    return NextResponse.json({ message: 'PIN set successfully' })
  } catch (error) {
    console.error('Set PIN error:', error)
    return NextResponse.json(
      { error: 'Failed to set PIN' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    await prisma.user.update({
      where: { id: userId },
      data: { pin: null },
    })

    return NextResponse.json({ message: 'PIN removed successfully' })
  } catch (error) {
    console.error('Remove PIN error:', error)
    return NextResponse.json(
      { error: 'Failed to remove PIN' },
      { status: 500 }
    )
  }
}
