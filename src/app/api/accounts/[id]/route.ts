import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET single account
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error fetching account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH update account
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    // Verify ownership
    const existingAccount = await prisma.account.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Normalize the name if provided
    let normalizedName = existingAccount.name // Keep existing name if not provided
    if (body.name && body.name.trim()) {
      normalizedName = body.name
        .trim()
        .replace(/[^a-zA-Z0-9\s\-_]/g, ' ')
        .replace(/[\s\-_]+/g, ' ')
        .trim()

      // Check if another account with this name exists (case-insensitive)
      const duplicate = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
          id: {
            not: id, // Exclude current account
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Account with this name already exists' },
          { status: 400 }
        )
      }
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        name: normalizedName,
        monthlyIncome: body.monthlyIncome ? parseFloat(body.monthlyIncome) : null,
        currentBalance: body.currentBalance !== undefined ? parseFloat(body.currentBalance) : undefined,
        totalLimit: body.totalLimit ? parseFloat(body.totalLimit) : null,
        availableLimit: body.availableLimit !== undefined ? parseFloat(body.availableLimit) : null,
        billingCycleStart: body.billingCycleStart,
        dueDate: body.dueDate,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE account
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const account = await prisma.account.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    await prisma.account.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
