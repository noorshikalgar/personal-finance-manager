import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get all monthly plans for the user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.monthlyPlan.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          select: {
            id: true,
            amount: true,
            isPaid: true,
            dueDate: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    // Calculate summary for each plan
    const plansWithSummary = plans.map((plan) => {
      const totalItems = plan.items.length;
      const paidItems = plan.items.filter((item) => item.isPaid).length;
      const unpaidItems = totalItems - paidItems;
      
      const totalPlanned = plan.items.reduce((sum, item) => sum + Number(item.amount), 0);
      const totalPaid = plan.items
        .filter((item) => item.isPaid)
        .reduce((sum, item) => sum + Number(item.amount), 0);
      
      const completionPercentage = totalItems > 0 ? (paidItems / totalItems) * 100 : 0;
      
      // Check for overdue items
      const now = new Date();
      const overdueItems = plan.items.filter(
        (item) => !item.isPaid && new Date(item.dueDate) < now
      ).length;

      return {
        id: plan.id,
        month: plan.month,
        year: plan.year,
        expectedIncome: Number(plan.expectedIncome),
        totalItems,
        paidItems,
        unpaidItems,
        overdueItems,
        totalPlanned,
        totalPaid,
        totalRemaining: totalPlanned - totalPaid,
        completionPercentage: Math.round(completionPercentage),
        projectedSavings: Number(plan.expectedIncome) - totalPlanned,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      };
    });

    return NextResponse.json(plansWithSummary);
  } catch (error) {
    console.error('Failed to fetch all plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
