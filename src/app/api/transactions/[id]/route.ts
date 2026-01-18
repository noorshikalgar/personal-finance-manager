import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateReminderOnTransaction } from '@/lib/notifications'
import { updateGoalFromTransaction, reverseGoalFromTransaction } from '@/lib/goals'

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
          reminderId: body.reminderId !== undefined ? body.reminderId : undefined,
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

    // Handle goal updates if category changed or amount changed
    const oldCategoryId = existingTransaction.categoryId;
    const newCategoryId = body.categoryId !== undefined ? body.categoryId : oldCategoryId;
    const oldType = existingTransaction.type;
    const newType = body.type || oldType;

    // Only update goals for INCOME/EXPENSE transactions, not ADJUSTMENT
    const shouldUpdateGoal = (oldType === 'INCOME' || oldType === 'EXPENSE') || (newType === 'INCOME' || newType === 'EXPENSE');

    if (shouldUpdateGoal) {
      // If category changed, reverse old goal and update new goal
      if (oldCategoryId !== newCategoryId) {
        // Reverse old goal if it existed
        if (oldCategoryId && (oldType === 'INCOME' || oldType === 'EXPENSE')) {
          await reverseGoalFromTransaction(oldCategoryId, oldType as 'INCOME' | 'EXPENSE', oldAmount).catch((error) => {
            console.error('Failed to reverse goal from old category:', error);
          });
        }
        // Update new goal if it exists
        if (newCategoryId && (newType === 'INCOME' || newType === 'EXPENSE')) {
          await updateGoalFromTransaction(newCategoryId, newType as 'INCOME' | 'EXPENSE', newAmount).catch((error) => {
            console.error('Failed to update goal from new category:', error);
          });
        }
      } else if (amountDelta !== 0 && newCategoryId && (oldType === 'INCOME' || oldType === 'EXPENSE')) {
        // Same category but amount changed - reverse old amount and add new amount
        await reverseGoalFromTransaction(newCategoryId, oldType as 'INCOME' | 'EXPENSE', oldAmount).catch((error) => {
          console.error('Failed to reverse goal:', error);
        });
        await updateGoalFromTransaction(newCategoryId, newType as 'INCOME' | 'EXPENSE', newAmount).catch((error) => {
          console.error('Failed to update goal:', error);
        });
      }
    }

    // Update reminder if linked (either new link or existing link with date change)
    const finalReminderId = body.reminderId !== undefined ? body.reminderId : existingTransaction.reminderId;
    const finalDate = body.date ? new Date(body.date) : existingTransaction.date;
    
    if (finalReminderId) {
      await updateReminderOnTransaction(finalReminderId, finalDate).catch((error) => {
        console.error('Failed to update reminder:', error);
      });
    }

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

    // Reverse goal progress if transaction was linked to a category with a goal
    if (transaction.categoryId) {
      await reverseGoalFromTransaction(
        transaction.categoryId,
        transaction.type as 'INCOME' | 'EXPENSE',
        Number(transaction.amount)
      ).catch((error) => {
        console.error('Failed to reverse goal from deleted transaction:', error);
      });
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
