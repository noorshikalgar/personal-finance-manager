import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const UpdateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['SAVINGS', 'DEBT_PAYOFF', 'EMERGENCY_FUND', 'INVESTMENT', 'VACATION', 'HOME', 'EDUCATION', 'CAR', 'OTHER']).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ABANDONED']).optional(),
  deadline: z.string().datetime().optional(),
});

// PUT - Update goal
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify goal ownership
    const goal = await prisma.goal.findUnique({
      where: { id: id },
    });

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const { categoryIds, ...goalUpdateData } = body;
    const validatedData = UpdateGoalSchema.parse(goalUpdateData);

    const updateData: any = {};
    
    // Normalize title if provided
    if (validatedData.title !== undefined) {
      const normalizedTitle = validatedData.title
        .trim()
        .replace(/[^a-zA-Z0-9\s\-_]/g, ' ')
        .replace(/[\s\-_]+/g, ' ')
        .trim()

      // Check if another goal with this title exists (case-insensitive)
      const duplicate = await prisma.goal.findFirst({
        where: {
          userId: session.user.id,
          title: {
            equals: normalizedTitle,
            mode: 'insensitive',
          },
          id: {
            not: id, // Exclude current goal
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Goal with this title already exists' },
          { status: 400 }
        )
      }

      updateData.title = normalizedTitle;
    }
    
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.targetAmount !== undefined) updateData.targetAmount = validatedData.targetAmount;
    if (validatedData.currentAmount !== undefined) updateData.currentAmount = validatedData.currentAmount;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      if (validatedData.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (validatedData.deadline !== undefined) {
      updateData.deadline = validatedData.deadline ? new Date(validatedData.deadline) : null;
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: id },
      data: updateData,
    });

    // Update category links if provided
    if (categoryIds !== undefined && Array.isArray(categoryIds)) {
      // First, unlink all categories from this goal
      await prisma.category.updateMany({
        where: {
          goalId: id,
          userId: session.user.id,
        },
        data: {
          goalId: null,
        },
      });

      // Then link the selected categories
      if (categoryIds.length > 0) {
        await prisma.category.updateMany({
          where: {
            id: { in: categoryIds },
            userId: session.user.id,
          },
          data: {
            goalId: id,
          },
        });
      }
    }

    return NextResponse.json({
      goal: {
        ...updatedGoal,
        progress: Math.min((Number(updatedGoal.currentAmount) / Number(updatedGoal.targetAmount)) * 100, 100),
        remaining: Math.max(Number(updatedGoal.targetAmount) - Number(updatedGoal.currentAmount), 0),
        daysRemaining: updatedGoal.deadline ? Math.ceil((updatedGoal.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete goal
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify goal ownership
    const goal = await prisma.goal.findUnique({
      where: { id: id },
    });

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 });
    }

    await prisma.goal.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
