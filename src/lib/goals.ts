import { prisma } from './prisma';

/**
 * Auto-update goal progress when a transaction is linked to a category that has a goal
 * @param categoryId - The category ID of the transaction
 * @param transactionType - The type of transaction (INCOME or EXPENSE)
 * @param amount - The transaction amount (positive for income, negative for expense)
 */
export async function updateGoalFromTransaction(
  categoryId: string,
  transactionType: 'INCOME' | 'EXPENSE',
  amount: number
) {
  try {
    // Find category and its linked goal
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        goal: true,
      },
    });

    // No goal linked to this category
    if (!category?.goal || !category.goalId) {
      return;
    }

    const goal = category.goal;

    // Skip if goal is not ACTIVE
    if (goal.status !== 'ACTIVE') {
      return;
    }

    // Determine if this transaction should update the goal based on progressMode
    let shouldUpdate = false;
    let amountToAdd = 0;

    if (goal.progressMode === 'INCOME_ADDS' && transactionType === 'INCOME') {
      // Income transaction adds to goal (for savings goals)
      shouldUpdate = true;
      amountToAdd = Math.abs(amount); // Ensure positive
    } else if (goal.progressMode === 'EXPENSE_ADDS' && transactionType === 'EXPENSE') {
      // Expense transaction adds to goal (for debt payoff goals)
      shouldUpdate = true;
      amountToAdd = Math.abs(amount); // Ensure positive
    }

    if (!shouldUpdate || amountToAdd === 0) {
      return;
    }

    // Update goal progress
    const newCurrentAmount = Number(goal.currentAmount) + amountToAdd;
    const updateData: Record<string, unknown> = {
      currentAmount: newCurrentAmount,
    };

    // Auto-complete goal if target reached
    if (newCurrentAmount >= Number(goal.targetAmount)) {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    await prisma.goal.update({
      where: { id: goal.id },
      data: updateData,
    });

    console.log(`Goal "${goal.title}" updated: +${amountToAdd} → ${newCurrentAmount}/${goal.targetAmount}`);
  } catch (error) {
    console.error('Error updating goal from transaction:', error);
    // Don't throw - goal update should not block transaction creation
  }
}

/**
 * Reverse goal progress when a transaction is deleted
 * @param categoryId - The category ID of the transaction
 * @param transactionType - The type of transaction (INCOME or EXPENSE)
 * @param amount - The transaction amount (positive for income, negative for expense)
 */
export async function reverseGoalFromTransaction(
  categoryId: string | null,
  transactionType: 'INCOME' | 'EXPENSE',
  amount: number
) {
  try {
    if (!categoryId) return;

    // Find category and its linked goal
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        goal: true,
      },
    });

    // No goal linked to this category
    if (!category?.goal || !category.goalId) {
      return;
    }

    const goal = category.goal;

    // Determine if this transaction affected the goal
    let shouldReverse = false;
    let amountToSubtract = 0;

    if (goal.progressMode === 'INCOME_ADDS' && transactionType === 'INCOME') {
      shouldReverse = true;
      amountToSubtract = Math.abs(amount);
    } else if (goal.progressMode === 'EXPENSE_ADDS' && transactionType === 'EXPENSE') {
      shouldReverse = true;
      amountToSubtract = Math.abs(amount);
    }

    if (!shouldReverse || amountToSubtract === 0) {
      return;
    }

    // Reverse goal progress
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

    console.log(`Goal "${goal.title}" reversed: -${amountToSubtract} → ${newCurrentAmount}/${goal.targetAmount}`);
  } catch (error) {
    console.error('Error reversing goal from transaction:', error);
    // Don't throw - goal reversal should not block transaction deletion
  }
}
