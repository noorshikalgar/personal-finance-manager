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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pin: true },
    })

    if (!user?.pin) {
      return NextResponse.json({ error: 'No PIN set' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(pin, user.pin)

    return NextResponse.json({ valid: isValid })
  } catch (error) {
    console.error('Verify PIN error:', error)
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    )
  }
}
