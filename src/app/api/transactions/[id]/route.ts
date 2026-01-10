import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH update transaction
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
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        account: true,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // If amount is changing, we need to adjust account balance
    const oldAmount = Number(existingTransaction.amount)
    const newAmount = body.amount ? parseFloat(body.amount) : oldAmount
    const amountDelta = newAmount - oldAmount

    const result = await prisma.$transaction(async (tx) => {
      // Update transaction
      const transaction = await tx.transaction.update({
        where: { id },
        data: {
          categoryId: body.categoryId !== undefined ? body.categoryId : undefined,
          date: body.date ? new Date(body.date) : undefined,
          amount: body.amount ? parseFloat(body.amount) : undefined,
          type: body.type,
          note: body.note !== undefined ? body.note : undefined,
        },
        include: {
          account: {
            select: { name: true },
          },
          category: {
            select: { name: true, color: true },
          },
        },
      })

      // Update account balance if amount changed
      if (amountDelta !== 0) {
        if (existingTransaction.account.type === 'BANK_SALARY') {
          await tx.account.update({
            where: { id: existingTransaction.accountId },
            data: {
              currentBalance: {
                increment: amountDelta,
              },
            },
          })
        } else if (existingTransaction.account.type === 'CREDIT_CARD') {
          await tx.account.update({
            where: { id: existingTransaction.accountId },
            data: {
              availableLimit: {
                increment: amountDelta,
              },
            },
          })
        }
      }

      return transaction
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE transaction
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

    // Verify ownership and get transaction details
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        account: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // Delete transaction
      await tx.transaction.delete({
        where: { id },
      })

      // Revert the amount from account balance
      const amount = Number(transaction.amount)
      
      if (transaction.account.type === 'BANK_SALARY') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: {
            currentBalance: {
              decrement: amount,
            },
          },
        })
      } else if (transaction.account.type === 'CREDIT_CARD') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: {
            availableLimit: {
              decrement: amount,
            },
          },
        })
      }
    })

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
