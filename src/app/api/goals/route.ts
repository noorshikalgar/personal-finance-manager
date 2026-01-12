import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Validation schemas
const CreateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['SAVINGS', 'DEBT_PAYOFF', 'EMERGENCY_FUND', 'INVESTMENT', 'VACATION', 'HOME', 'EDUCATION', 'CAR', 'OTHER']),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0, 'Current amount cannot be negative').optional().default(0),
  deadline: z.string().datetime().optional(),
});

const UpdateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['SAVINGS', 'DEBT_PAYOFF', 'EMERGENCY_FUND', 'INVESTMENT', 'VACATION', 'HOME', 'EDUCATION', 'CAR', 'OTHER']).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']).optional(),
  deadline: z.string().datetime().optional(),
});

// GET - Fetch all goals for user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate progress percentage for each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100),
      remaining: Math.max(Number(goal.targetAmount) - Number(goal.currentAmount), 0),
      daysRemaining: goal.deadline ? Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
    }));

    return NextResponse.json({ goals: goalsWithProgress });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new goal
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { categoryIds, ...goalData } = body;
    const validatedData = CreateGoalSchema.parse(goalData);

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        targetAmount: validatedData.targetAmount,
        currentAmount: validatedData.currentAmount,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
      },
    });

    // Link categories if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await prisma.category.updateMany({
        where: {
          id: { in: categoryIds },
          userId: session.user.id, // Security: ensure user owns these categories
        },
        data: {
          goalId: goal.id,
        },
      });
    }

    return NextResponse.json(
      {
        goal: {
          ...goal,
          progress: 0,
          remaining: Number(goal.targetAmount),
          daysRemaining: goal.deadline ? Math.ceil((goal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
