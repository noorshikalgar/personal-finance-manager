import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cron job endpoint to process recurring transactions
 * This should be called daily (e.g., via a cron service or GitHub Actions)
 * 
 * Behavior rules:
 * - If paused before run date → skip this month
 * - If paused after run date → current month stays, next month skipped
 * - If unpaused after run date → resume from next cycle only (no retro-add)
 * - No duplicates allowed
 * - System is idempotent
 */
export async function POST(req: Request) {
  try {
    // Simple auth check - you might want to use a cron secret
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'change-me-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const currentDay = today.getDate()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

    // Find all active recurring transactions that should run today
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        dayOfMonth: currentDay,
        paused: false,
        startDate: {
          lte: today,
        },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
      include: {
        account: true,
      },
    })

    const results = {
      processed: 0,
      skipped: 0,
      errors: 0,
    }

    for (const recurring of recurringTransactions) {
      try {
        // Check if already ran today (idempotent check)
        if (recurring.lastRunAt) {
          const lastRun = new Date(recurring.lastRunAt)
          if (lastRun >= startOfToday && lastRun <= endOfToday) {
            results.skipped++
            continue
          }
        }

        // Create the transaction in a database transaction
        await prisma.$transaction(async (tx) => {
          // Create transaction
          await tx.transaction.create({
            data: {
              userId: recurring.userId,
              accountId: recurring.accountId,
              categoryId: recurring.categoryId,
              date: today,
              amount: recurring.amount,
              type: recurring.type,
              note: recurring.note ? `${recurring.note} (Auto)` : '(Recurring)',
              recurringTransactionId: recurring.id,
            },
          })

          // Update account balance
          const amount = Number(recurring.amount)
          
          if (recurring.account.type === 'BANK_SALARY') {
            await tx.account.update({
              where: { id: recurring.accountId },
              data: {
                currentBalance: {
                  increment: amount,
                },
              },
            })
          } else if (recurring.account.type === 'CREDIT_CARD') {
            await tx.account.update({
              where: { id: recurring.accountId },
              data: {
                availableLimit: {
                  increment: amount,
                },
              },
            })
          }

          // Update lastRunAt
          await tx.recurringTransaction.update({
            where: { id: recurring.id },
            data: {
              lastRunAt: today,
            },
          })
        })

        results.processed++
      } catch (error) {
        console.error(`Error processing recurring transaction ${recurring.id}:`, error)
        results.errors++
      }
    }

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      results,
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check cron status (optional)
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Recurring transactions cron endpoint is ready',
  })
}
