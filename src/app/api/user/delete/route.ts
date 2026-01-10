import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Delete all user data in a transaction
    await prisma.$transaction(async (tx: any) => {
      // Delete transactions first (has foreign keys to accounts and categories)
      await tx.transaction.deleteMany({
        where: {
          account: { userId },
        },
      })

      // Delete recurring transactions
      await tx.recurringTransaction.deleteMany({
        where: {
          account: { userId },
        },
      })

      // Delete accounts
      await tx.account.deleteMany({
        where: { userId },
      })

      // Delete categories
      await tx.category.deleteMany({
        where: { userId },
      })

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId },
      })
    })

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
