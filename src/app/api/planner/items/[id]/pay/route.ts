import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MarkAsPaidSchema = z.object({
  paidOn: z.string().datetime().optional(),
  createTransaction: z.boolean().optional().default(false),
  accountId: z.string().optional(),
});

// POST - Mark plan item as paid
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body, handle empty body gracefully
    let body = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Empty body is fine, use defaults
    }
    const validatedData = MarkAsPaidSchema.parse(body);

    // Get plan item
    const item = await prisma.planItem.findUnique({
      where: { id },
      include: { plan: true, category: true },
    });

    if (!item || item.plan.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Item not found or unauthorized' },
        { status: 404 }
      );
    }

    if (item.isPaid) {
      return NextResponse.json(
        { error: 'Item is already marked as paid' },
        { status: 400 }
      );
    }

    const paidDate = validatedData.paidOn ? new Date(validatedData.paidOn) : new Date();

    // Check if transaction already exists for this item (fuzzy match)
    const startOfDay = new Date(paidDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(paidDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Matched on amount + day + type alone, this previously collided whenever two
    // different bills shared an amount and a day (e.g. two ₹499 subscriptions due
    // the same day): whichever transaction matched first got linked to both plan
    // items, and the unique constraint on PlanItem.transactionId only surfaced
    // that as a confusing failure for the second one instead of a correct,
    // separate link. Excluding transactions already linked to a plan item and
    // requiring a category match (when the item has one) narrows most real
    // collisions away. For the remaining case — still more than one unclaimed
    // candidate — there's no signal left to break the tie, so treat it as no
    // match rather than silently guessing.
    const candidateTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        amount: -Math.abs(item.amount), // Expenses are negative
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        type: 'EXPENSE',
        planItem: { is: null },
        ...(item.categoryId ? { categoryId: item.categoryId } : {}),
      },
      take: 2,
    });
    const existingTransaction =
      candidateTransactions.length === 1 ? candidateTransactions[0] : undefined;

    let transactionId = existingTransaction?.id;

    // Create transaction if requested and no existing transaction found
    if (validatedData.createTransaction && !existingTransaction) {
      if (!validatedData.accountId) {
        return NextResponse.json(
          { error: 'Account ID is required when creating transaction' },
          { status: 400 }
        );
      }

      const transaction = await prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId: validatedData.accountId,
          categoryId: item.categoryId,
          amount: -Math.abs(item.amount), // Expenses are negative
          type: 'EXPENSE',
          date: paidDate,
          note: `Payment: ${item.name}`,
        },
      });

      transactionId = transaction.id;
    }

    // Mark item as paid
    const updatedItemRaw = await prisma.planItem.update({
      where: { id },
      data: {
        isPaid: true,
        paidOn: paidDate,
        transactionId: transactionId,
      },
      include: {
        category: true,
        transaction: true,
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

    // Serialize
    const updatedItem = {
      ...updatedItemRaw,
      amount: Number(updatedItemRaw.amount),
      category: updatedItemRaw.category ? {
        ...updatedItemRaw.category,
        monthlyBudget: updatedItemRaw.category.monthlyBudget ? Number(updatedItemRaw.category.monthlyBudget) : null,
      } : null,
      transaction: updatedItemRaw.transaction ? {
        ...updatedItemRaw.transaction,
        amount: Number(updatedItemRaw.transaction.amount),
      } : null,
      recurringTransaction: updatedItemRaw.recurringTransaction ? {
        ...updatedItemRaw.recurringTransaction,
        amount: Number(updatedItemRaw.recurringTransaction.amount),
      } : null,
    };

    return NextResponse.json({
      item: updatedItem,
      transactionCreated: validatedData.createTransaction && !existingTransaction,
      linkedExisting: !!existingTransaction,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to mark item as paid:', error);
    return NextResponse.json(
      { error: 'Failed to mark as paid' },
      { status: 500 }
    );
  }
}
