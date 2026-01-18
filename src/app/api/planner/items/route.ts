import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CreateItemSchema = z.object({
  planId: z.string(),
  name: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().or(z.date()).transform((val) => typeof val === 'string' ? new Date(val) : val),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
  recurringTransactionId: z.string().optional(),
  isFromRecurring: z.boolean().optional().default(false),
});

// POST - Add item to monthly plan
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreateItemSchema.parse(body);

    // Verify plan exists and belongs to user
    const plan = await prisma.monthlyPlan.findUnique({
      where: {
        id: validatedData.planId,
        userId: session.user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create plan item
    const itemRaw = await prisma.planItem.create({
      data: {
        planId: plan.id,
        name: validatedData.name,
        amount: validatedData.amount,
        dueDate: validatedData.dueDate,
        categoryId: validatedData.categoryId,
        notes: validatedData.notes,
        recurringTransactionId: validatedData.recurringTransactionId,
        isFromRecurring: validatedData.isFromRecurring,
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

    // Serialize Decimal to number
    const item = {
      ...itemRaw,
      amount: Number(itemRaw.amount),
      category: itemRaw.category ? {
        ...itemRaw.category,
        monthlyBudget: itemRaw.category.monthlyBudget ? Number(itemRaw.category.monthlyBudget) : null,
      } : null,
      recurringTransaction: itemRaw.recurringTransaction ? {
        ...itemRaw.recurringTransaction,
        amount: Number(itemRaw.recurringTransaction.amount),
      } : null,
    };

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to create plan item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
