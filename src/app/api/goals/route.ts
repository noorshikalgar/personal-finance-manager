import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Validation schemas
const CreateGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['SAVINGS', 'DEBT_PAYOFF', 'EMERGENCY_FUND', 'INVESTMENT', 'VACATION', 'HOME', 'EDUCATION', 'CAR', 'OTHER']),
  progressMode: z.enum(['INCOME_ADDS', 'EXPENSE_ADDS']).optional().default('INCOME_ADDS'),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().min(0, 'Current amount cannot be negative').optional().default(0),
  deadline: z.string().datetime().optional(),
});

// GET - Fetch all goals for user
export async function GET() {
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
    const validatedData = CreateGoalSchema.parse(body);

    // Normalize the goal title
    const normalizedTitle = validatedData.title
      .trim()
      .replace(/[^a-zA-Z0-9\s\-_]/g, ' ')
      .replace(/[\s\-_]+/g, ' ')
      .trim()

    // Check if goal with this title already exists for this user (case-insensitive)
    const existing = await prisma.goal.findFirst({
      where: {
        userId: session.user.id,
        title: {
          equals: normalizedTitle,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Goal with this title already exists' },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        title: normalizedTitle,
        description: validatedData.description,
        category: validatedData.category,
        progressMode: validatedData.progressMode,
        targetAmount: validatedData.targetAmount,
        currentAmount: validatedData.currentAmount,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
      },
    });

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
