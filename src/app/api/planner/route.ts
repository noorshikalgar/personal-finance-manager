import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get monthly plan for a specific month/year
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    const plan = await prisma.monthlyPlan.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      include: {
        items: {
          include: {
            category: true,
            transaction: true,
            recurringTransaction: true,
          },
          orderBy: [
            { isPaid: 'asc' }, // Unpaid first
            { dueDate: 'asc' }, // Then by due date
          ],
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    // Calculate summary stats
    const unpaidItems = plan.items.filter((item) => !item.isPaid);
    const paidItems = plan.items.filter((item) => item.isPaid);

    const totalPlanned = plan.items.reduce((sum, item) => sum + item.amount, 0);
    const totalPaid = paidItems.reduce((sum, item) => sum + item.amount, 0);
    const totalRemaining = unpaidItems.reduce((sum, item) => sum + item.amount, 0);

    const projectedSavings = plan.expectedIncome - totalPlanned;

    return NextResponse.json({
      plan,
      summary: {
        totalPlanned,
        totalPaid,
        totalRemaining,
        unpaidCount: unpaidItems.length,
        paidCount: paidItems.length,
        projectedSavings,
        savingsRate: plan.expectedIncome > 0 ? (projectedSavings / plan.expectedIncome) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch monthly plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

const CreatePlanSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  expectedIncome: z.number().min(0).optional().default(0),
});

// POST - Create a new monthly plan
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreatePlanSchema.parse(body);

    // Check if plan already exists
    const existing = await prisma.monthlyPlan.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Plan already exists for this month' },
        { status: 400 }
      );
    }

    // Create new plan
    const plan = await prisma.monthlyPlan.create({
      data: {
        userId: session.user.id,
        month: validatedData.month,
        year: validatedData.year,
        expectedIncome: validatedData.expectedIncome,
      },
      include: {
        items: {
          include: {
            category: true,
            transaction: true,
            recurringTransaction: true,
          },
        },
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to create monthly plan:', error);
    return NextResponse.json(
      { error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}

const UpdatePlanSchema = z.object({
  expectedIncome: z.number().min(0).optional(),
});

// PUT - Update monthly plan
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = UpdatePlanSchema.parse(body);

    // Update plan
    const plan = await prisma.monthlyPlan.update({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      data: validatedData,
      include: {
        items: {
          include: {
            category: true,
            transaction: true,
            recurringTransaction: true,
          },
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to update monthly plan:', error);
    return NextResponse.json(
      { error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

// DELETE - Delete monthly plan
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    await prisma.monthlyPlan.delete({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete monthly plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
