import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId,
  relatedType,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Check for overdue reminders and create notifications
 */
export async function checkOverdueReminders() {
  try {
    const now = new Date();

    // Find all overdue reminders that haven't been notified yet
    const overdueReminders = await prisma.reminder.findMany({
      where: {
        nextDate: {
          lt: now,
        },
        status: {
          not: 'COMPLETED',
        },
      },
      include: {
        user: true,
      },
    });

    for (const reminder of overdueReminders) {
      // Check if notification already exists for this reminder
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: reminder.userId,
          type: 'REMINDER_OVERDUE',
          relatedId: reminder.id,
          relatedType: 'reminder',
        },
      });

      if (!existingNotification) {
        await createNotification({
          userId: reminder.userId,
          type: 'REMINDER_OVERDUE',
          title: 'Reminder Overdue',
          message: `Your reminder "${reminder.title}" is overdue!`,
          relatedId: reminder.id,
          relatedType: 'reminder',
        });
      }
    }

    return overdueReminders.length;
  } catch (error) {
    console.error('Failed to check overdue reminders:', error);
    throw error;
  }
}

/**
 * Check for reminders due soon (within 3 days) and create notifications
 */
export async function checkUpcomingReminders() {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find reminders due within the next 3 days
    const upcomingReminders = await prisma.reminder.findMany({
      where: {
        nextDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
        status: {
          not: 'COMPLETED',
        },
      },
      include: {
        user: true,
      },
    });

    for (const reminder of upcomingReminders) {
      // Check if notification already exists for this reminder
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: reminder.userId,
          type: 'REMINDER_DUE_SOON',
          relatedId: reminder.id,
          relatedType: 'reminder',
        },
      });

      if (!existingNotification) {
        const daysUntilDue = Math.ceil(
          (reminder.nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        await createNotification({
          userId: reminder.userId,
          type: 'REMINDER_DUE_SOON',
          title: 'Reminder Due Soon',
          message: `Your reminder "${reminder.title}" is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
          relatedId: reminder.id,
          relatedType: 'reminder',
        });
      }
    }

    return upcomingReminders.length;
  } catch (error) {
    console.error('Failed to check upcoming reminders:', error);
    throw error;
  }
}

/**
 * Check if a category budget has been exceeded
 */
export async function checkCategoryBudget(categoryId: string, userId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        transactions: {
          where: {
            date: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
      },
    });

    if (!category || !category.monthlyBudget) {
      return null;
    }

    // Calculate total spending for the month (convert Decimal to number)
    const totalSpent = category.transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

    const budget = Number(category.monthlyBudget);

    // Check if budget exceeded
    if (totalSpent > budget) {
      // Check if notification already exists for this month
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'BUDGET_EXCEEDED',
          relatedId: categoryId,
          relatedType: 'category',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      });

      if (!existingNotification) {
        await createNotification({
          userId,
          type: 'BUDGET_EXCEEDED',
          title: 'Budget Exceeded',
          message: `You've exceeded your budget for "${category.name}" by ${(totalSpent - budget).toFixed(2)}!`,
          relatedId: categoryId,
          relatedType: 'category',
        });
      }
    }

    return { totalSpent, budget, exceeded: totalSpent > budget };
  } catch (error) {
    console.error('Failed to check category budget:', error);
    throw error;
  }
}

// Goal completion is now detected and notified inside updateGoalFromTransaction
// (src/lib/goals.ts), which is the single place that mutates Goal.currentAmount.
// A second, independently-computed check here previously disagreed with it —
// see AUDIT_REPORT for details — so it was removed rather than kept in sync by hand.

/**
 * Update reminder when a transaction is linked to it
 * Automatically calculates and sets the next due date based on cycle
 * 
 * Smart Logic:
 * - Calculates the previous cycle's due date
 * - Only accepts transactions for the CURRENT cycle (between previous and future due dates)
 * - Rejects historical payments from old cycles
 * - Accepts early payments (before due date)
 * - Accepts late payments (after due date)
 * - Always calculates next date from current next date (not transaction date) for consistency
 */
export async function updateReminderOnTransaction(reminderId: string, transactionDate: Date) {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: reminderId },
    });

    if (!reminder) {
      return null;
    }

    const txDate = new Date(transactionDate);
    const currentNextDate = new Date(reminder.nextDate);

    // Calculate the PREVIOUS next date (one cycle before current)
    const previousNextDate = new Date(currentNextDate);
    
    switch (reminder.cycle) {
      case 'DAILY':
        previousNextDate.setDate(previousNextDate.getDate() - 1);
        break;
      case 'WEEKLY':
        previousNextDate.setDate(previousNextDate.getDate() - 7);
        break;
      case 'MONTHLY':
        previousNextDate.setMonth(previousNextDate.getMonth() - 1);
        break;
      case 'QUARTERLY':
        previousNextDate.setMonth(previousNextDate.getMonth() - 3);
        break;
      case 'HALF_YEARLY':
        previousNextDate.setMonth(previousNextDate.getMonth() - 6);
        break;
      case 'YEARLY':
        previousNextDate.setFullYear(previousNextDate.getFullYear() - 1);
        break;
      case 'CUSTOM':
        if (reminder.customCycleDays) {
          previousNextDate.setDate(previousNextDate.getDate() - reminder.customCycleDays);
        }
        break;
    }

    // Only update if transaction is for the CURRENT cycle
    // Transaction must be AFTER the previous cycle's due date
    // This handles:
    // ✓ Early payments (Dec 12, 2025 for Jan 15, 2026 due)
    // ✓ On-time payments (Jan 15, 2026)
    // ✓ Late payments (Mar 10, 2026 for Jan 15, 2026 due)
    // ✗ Historical payments (Jan 15, 2025 for Jan 15, 2026 due - this is from PREVIOUS cycle)
    if (txDate > previousNextDate) {
      // Calculate NEW next date by adding one cycle to CURRENT next date
      // This ensures consistency - always moves forward one cycle regardless of payment timing
      const newNextDate = new Date(currentNextDate);

      switch (reminder.cycle) {
        case 'DAILY':
          newNextDate.setDate(newNextDate.getDate() + 1);
          break;
        case 'WEEKLY':
          newNextDate.setDate(newNextDate.getDate() + 7);
          break;
        case 'MONTHLY':
          newNextDate.setMonth(newNextDate.getMonth() + 1);
          break;
        case 'QUARTERLY':
          newNextDate.setMonth(newNextDate.getMonth() + 3);
          break;
        case 'HALF_YEARLY':
          newNextDate.setMonth(newNextDate.getMonth() + 6);
          break;
        case 'YEARLY':
          newNextDate.setFullYear(newNextDate.getFullYear() + 1);
          break;
        case 'CUSTOM':
          if (reminder.customCycleDays) {
            newNextDate.setDate(newNextDate.getDate() + reminder.customCycleDays);
          }
          break;
      }

      // Determine new status
      const now = new Date();
      let newStatus: 'UPCOMING' | 'OVERDUE' = 'UPCOMING';
      if (newNextDate < now) {
        newStatus = 'OVERDUE';
      } else if (newNextDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        newStatus = 'UPCOMING';
      }

      // Update reminder
      await prisma.reminder.update({
        where: { id: reminderId },
        data: {
          lastDate: txDate,
          nextDate: newNextDate,
          status: newStatus,
        },
      });

      return { 
        lastDate: txDate, 
        nextDate: newNextDate, 
        status: newStatus,
        message: 'Reminder updated successfully'
      };
    }

    // Transaction is too old (from previous cycle), don't update
    return { 
      message: 'Transaction is from a previous cycle and will not update the reminder',
      previousNextDate,
      currentNextDate,
      transactionDate: txDate
    };
  } catch (error) {
    console.error('Failed to update reminder:', error);
    throw error;
  }
}
