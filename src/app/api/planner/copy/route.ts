import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CopyPlanSchema = z.object({
  sourceMonth: z.number().min(1).max(12),
  sourceYear: z.number().min(2020).max(2100),
  targetMonth: z.number().min(1).max(12),
  targetYear: z.number().min(2020).max(2100),
});

// POST - Copy plan from one month to another
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CopyPlanSchema.parse(body);

    // Get source plan
    const sourcePlan = await prisma.monthlyPlan.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: validatedData.sourceMonth,
          year: validatedData.sourceYear,
        },
      },
      include: {
        items: {
          include: {
            category: true,
            recurringTransaction: true,
          },
        },
      },
    });

    if (!sourcePlan) {
      return NextResponse.json(
        { error: 'Source plan not found' },
        { status: 404 }
      );
    }

    // Check if target plan already exists
    const existingTarget = await prisma.monthlyPlan.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: validatedData.targetMonth,
          year: validatedData.targetYear,
        },
      },
    });

    if (existingTarget) {
      return NextResponse.json(
        { error: 'Plan already exists for target month' },
        { status: 400 }
      );
    }

    // Create new plan
    const targetPlan = await prisma.monthlyPlan.create({
      data: {
        userId: session.user.id,
        month: validatedData.targetMonth,
        year: validatedData.targetYear,
        expectedIncome: sourcePlan.expectedIncome,
      },
    });

    // Copy plan items
    const copiedItems = await Promise.all(
      sourcePlan.items.map(async (item) => {
        // Calculate new due date in target month
        const sourceDueDate = new Date(item.dueDate);
        const dayOfMonth = sourceDueDate.getDate();
        
        let newDueDate = new Date(validatedData.targetYear, validatedData.targetMonth - 1, dayOfMonth);
        
        // If the day doesn't exist in target month, use last day of month
        if (newDueDate.getMonth() !== validatedData.targetMonth - 1) {
          newDueDate = new Date(validatedData.targetYear, validatedData.targetMonth, 0);
        }

        return prisma.planItem.create({
          data: {
            planId: targetPlan.id,
            name: item.name,
            amount: item.amount,
            dueDate: newDueDate,
            categoryId: item.categoryId,
            notes: item.notes,
            recurringTransactionId: item.recurringTransactionId,
            isFromRecurring: item.isFromRecurring,
          },
          include: {
            category: true,
            recurringTransaction: true,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      plan: {
        ...targetPlan,
        items: copiedItems,
      },
      copiedCount: copiedItems.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to copy plan:', error);
    return NextResponse.json(
      { error: 'Failed to copy plan' },
      { status: 500 }
    );
  }
}
