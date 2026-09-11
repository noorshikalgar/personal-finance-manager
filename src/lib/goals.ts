import { prisma } from './prisma';
import { createNotification } from './notifications';

/**
 * Auto-update goal progress when a transaction is explicitly linked to a goal
 * via Transaction.goalId. This is the single source of truth for goal progress —
 * do not recompute it elsewhere from category transactions.
 */
export async function updateGoalFromTransaction(
  goalId: string | null | undefined,
  transactionType: 'INCOME' | 'EXPENSE',
  amount: number
) {
  try {
    if (!goalId) return;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return;

    // Skip if goal is not ACTIVE
    if (goal.status !== 'ACTIVE') {
      return;
    }

    // Determine if this transaction should update the goal based on progressMode
    const shouldUpdate =
      (goal.progressMode === 'INCOME_ADDS' && transactionType === 'INCOME') ||
      (goal.progressMode === 'EXPENSE_ADDS' && transactionType === 'EXPENSE');

    const amountToAdd = Math.abs(amount);

    if (!shouldUpdate || amountToAdd === 0) {
      return;
    }

    const newCurrentAmount = Number(goal.currentAmount) + amountToAdd;
    const justCompleted = newCurrentAmount >= Number(goal.targetAmount);

    const updateData: Record<string, unknown> = {
      currentAmount: newCurrentAmount,
    };

    if (justCompleted) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    });

    if (justCompleted) {
      await createNotification({
        userId: goal.userId,
        type: 'GOAL_COMPLETED',
        title: 'Goal Completed! 🎉',
        message: `Congratulations! You've reached your goal "${goal.title}"!`,
        relatedId: goal.id,
        relatedType: 'goal',
      }).catch((error) => {
        console.error('Failed to send goal completion notification:', error);
      });
    }
  } catch (error) {
    console.error('Error updating goal from transaction:', error);
    // Don't throw - goal update should not block transaction creation
  }
}

/**
 * Reverse goal progress when a transaction is deleted or unlinked from a goal.
 */
export async function reverseGoalFromTransaction(
  goalId: string | null | undefined,
  transactionType: 'INCOME' | 'EXPENSE',
  amount: number
) {
  try {
    if (!goalId) return;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return;

    const shouldReverse =
      (goal.progressMode === 'INCOME_ADDS' && transactionType === 'INCOME') ||
      (goal.progressMode === 'EXPENSE_ADDS' && transactionType === 'EXPENSE');

    const amountToSubtract = Math.abs(amount);

    if (!shouldReverse || amountToSubtract === 0) {
      return;
    }

    const newCurrentAmount = Math.max(0, Number(goal.currentAmount) - amountToSubtract);
    const updateData: Record<string, unknown> = {
      currentAmount: newCurrentAmount,
    };

    // If goal was completed, potentially revert to ACTIVE
    if (goal.status === 'COMPLETED' && newCurrentAmount < Number(goal.targetAmount)) {
      updateData.status = 'ACTIVE';
      updateData.completedAt = null;
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    });
  } catch (error) {
    console.error('Error reversing goal from transaction:', error);
    // Don't throw - goal reversal should not block transaction deletion
  }
}
