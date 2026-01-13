'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    // Navigate to related entity
    if (notification.relatedType && notification.relatedId) {
      const routeMap: Record<string, string> = {
        reminder: `/dashboard/reminders/${notification.relatedId}`,
        category: `/dashboard/categories`,
        goal: `/dashboard/goals/${notification.relatedId}`,
      };

      const route = routeMap[notification.relatedType];
      if (route) {
        setShowDropdown(false);
        router.push(route);
      }
    }
  };

  // Get notification icon color based on type
  const getNotificationColor = (type: string) => {
    const colorMap: Record<string, string> = {
      REMINDER_OVERDUE: 'text-red-500',
      REMINDER_DUE_SOON: 'text-yellow-500',
      BUDGET_EXCEEDED: 'text-red-500',
      GOAL_COMPLETED: 'text-green-500',
      MONTHLY_SUMMARY: 'text-blue-500',
      SYSTEM: 'text-gray-500',
    };
    return colorMap[type] || 'text-gray-500';
  };

  // Format relative time
  const getRelativeTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-2 h-2 rounded-full ${getNotificationColor(
                                notification.type
                              )}`}
                            />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {getRelativeTime(notification.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition-colors"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
