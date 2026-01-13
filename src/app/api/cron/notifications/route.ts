import { NextResponse } from 'next/server';
import { checkOverdueReminders, checkUpcomingReminders } from '@/lib/notifications';

// GET /api/cron/notifications - Check for reminders and create notifications
export async function GET() {
  try {
    // Verify this is called from a cron job (optional security)
    // You can add a secret token check here if needed

    const overdueCount = await checkOverdueReminders();
    const upcomingCount = await checkUpcomingReminders();

    return NextResponse.json({
      success: true,
      overdueReminders: overdueCount,
      upcomingReminders: upcomingCount,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}
