import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Fetch user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 notifications
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete all read notifications
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        isRead: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
