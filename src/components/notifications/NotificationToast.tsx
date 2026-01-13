'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export default function NotificationToast() {
  const lastNotificationId = useRef<string | null>(null);

  useEffect(() => {
    // Poll for new notifications
    const checkForNewNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?unreadOnly=true');
        if (response.ok) {
          const notifications = await response.json();
          
          if (notifications.length > 0) {
            const latestNotification = notifications[0];
            
            // Only show toast if this is a new notification
            if (latestNotification.id !== lastNotificationId.current) {
              lastNotificationId.current = latestNotification.id;
              
              // Show toast based on notification type
              switch (latestNotification.type) {
                case 'REMINDER_OVERDUE':
                  toast.error(latestNotification.title, {
                    description: latestNotification.message,
                    duration: 5000,
                  });
                  break;
                case 'REMINDER_DUE_SOON':
                  toast.warning(latestNotification.title, {
                    description: latestNotification.message,
                    duration: 5000,
                  });
                  break;
                case 'BUDGET_EXCEEDED':
                  toast.error(latestNotification.title, {
                    description: latestNotification.message,
                    duration: 5000,
                  });
                  break;
                case 'GOAL_COMPLETED':
                  toast.success(latestNotification.title, {
                    description: latestNotification.message,
                    duration: 5000,
                  });
                  break;
                case 'MONTHLY_SUMMARY':
                  toast.info(latestNotification.title, {
                    description: latestNotification.message,
                    duration: 5000,
                  });
                  break;
                default:
                  toast(latestNotification.title, {
                    description: latestNotification.message,
                    duration: 5000,
                  });
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to check for new notifications:', error);
      }
    };

    // Check immediately on mount
    checkForNewNotifications();

    // Then check every 30 seconds
    const interval = setInterval(checkForNewNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}
