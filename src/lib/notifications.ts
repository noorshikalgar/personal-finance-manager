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

/**
 * Check if a goal has been completed
 */
export async function checkGoalCompletion(goalId: string, userId: string) {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        categories: {
          include: {
            transactions: true,
          },
        },
      },
    });

    if (!goal) {
      return null;
    }

    // Calculate total saved (convert Decimal to number)
    const totalSaved = goal.categories.reduce(
      (sum, category) =>
        sum +
        category.transactions.reduce(
          (catSum, transaction) => catSum + Number(transaction.amount),
          0
        ),
      0
    );

    const targetAmount = Number(goal.targetAmount);

    // Check if goal completed
    if (totalSaved >= targetAmount && goal.status !== 'COMPLETED') {
      // Update goal status
      await prisma.goal.update({
        where: { id: goalId },
        data: { status: 'COMPLETED' },
      });

      // Create notification
      await createNotification({
        userId,
        type: 'GOAL_COMPLETED',
        title: 'Goal Completed! 🎉',
        message: `Congratulations! You've reached your goal "${goal.title}"!`,
        relatedId: goalId,
        relatedType: 'goal',
      });
    }

    return { totalSaved, targetAmount, completed: totalSaved >= targetAmount };
  } catch (error) {
    console.error('Failed to check goal completion:', error);
    throw error;
  }
}
