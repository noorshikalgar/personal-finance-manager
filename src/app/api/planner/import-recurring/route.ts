import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ImportRecurringSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  recurringTransactionIds: z.array(z.string()).min(1),
});

// POST - Import recurring transactions into monthly plan
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = ImportRecurringSchema.parse(body);

    // Get or create plan for this month
    let plan = await prisma.monthlyPlan.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    });

    if (!plan) {
      plan = await prisma.monthlyPlan.create({
        data: {
          userId: session.user.id,
          month: validatedData.month,
          year: validatedData.year,
          expectedIncome: 0,
        },
      });
    }

    // Get recurring transactions
    const recurringTransactions = await prisma.recurringTransaction.findMany({
      where: {
        id: { in: validatedData.recurringTransactionIds },
        userId: session.user.id,
        paused: false,
      },
      include: {
        category: true,
      },
    });

    if (recurringTransactions.length === 0) {
      return NextResponse.json(
        { error: 'No valid recurring transactions found' },
        { status: 400 }
      );
    }

    // Create plan items from recurring transactions
    const planItemsRaw = await Promise.all(
      recurringTransactions.map(async (recurring) => {
        // Check if already imported
        const existing = await prisma.planItem.findFirst({
          where: {
            planId: plan!.id,
            recurringTransactionId: recurring.id,
          },
          include: {
            category: true,
            recurringTransaction: {
              select: {
                id: true,
                amount: true,
                note: true,
                type: true,
                dayOfMonth: true,
                categoryId: true,
              },
            },
          },
        });

        if (existing) {
          return existing;
        }

        // Calculate due date for this month
        const dueDate = new Date(validatedData.year, validatedData.month - 1, recurring.dayOfMonth);
        
        // If the day doesn't exist in this month (e.g., 31st in Feb), use last day of month
        if (dueDate.getMonth() !== validatedData.month - 1) {
          dueDate.setDate(0); // Set to last day of previous month (which is last day of target month)
        }

        return prisma.planItem.create({
          data: {
            planId: plan!.id,
            name: recurring.note || 'Recurring Payment',
            amount: Math.abs(parseFloat(recurring.amount.toString())),
            dueDate,
            categoryId: recurring.categoryId,
            recurringTransactionId: recurring.id,
            isFromRecurring: true,
          },
          include: {
            category: true,
            recurringTransaction: {
              select: {
                id: true,
                amount: true,
                note: true,
                type: true,
                dayOfMonth: true,
                categoryId: true,
              },
            },
          },
        });
      })
    );

    // Serialize items
    const planItems = planItemsRaw.map(item => ({
      ...item,
      amount: Number(item.amount),
      category: item.category ? {
        ...item.category,
        monthlyBudget: item.category.monthlyBudget ? Number(item.category.monthlyBudget) : null,
      } : null,
      recurringTransaction: item.recurringTransaction ? {
        ...item.recurringTransaction,
        amount: Number(item.recurringTransaction.amount),
      } : null,
    }));

    return NextResponse.json({
      success: true,
      importedCount: planItems.length,
      items: planItems,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to import recurring transactions:', error);
    return NextResponse.json(
      { error: 'Failed to import recurring transactions' },
      { status: 500 }
    );
  }
}
