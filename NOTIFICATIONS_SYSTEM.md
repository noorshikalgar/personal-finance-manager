# Notifications System

A complete notifications system for the Personal Finance Manager app with real-time alerts, budget monitoring, and goal tracking.

## ✨ Features

### Notification Types
- **Reminder Overdue**: Alert when a reminder due date has passed
- **Reminder Due Soon**: Notify 3 days before a reminder is due
- **Budget Exceeded**: Alert when category spending exceeds budget
- **Goal Completed**: Celebrate when a savings goal is reached
- **Monthly Summary**: Monthly financial report (future enhancement)
- **System**: General system notifications

### User Experience
- ✅ **Real-time Toast Notifications**: Instant alerts for new notifications using Sonner
- ✅ **Notification Bell**: Badge counter showing unread count
- ✅ **Dropdown Panel**: View all notifications with quick actions
- ✅ **Mark as Read**: Individual or bulk mark all as read
- ✅ **Delete**: Remove notifications individually or clear all read
- ✅ **Smart Navigation**: Click notification to jump to related entity
- ✅ **Relative Time**: Human-readable timestamps (e.g., "5m ago", "2h ago")

### Automated Triggers
- ✅ **Transaction Created**: Check budget limits and goal completion
- ✅ **Cron Job**: Periodic check for overdue/upcoming reminders
- ✅ **Smart Deduplication**: Prevents duplicate notifications

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── notifications/
│   │   │   ├── route.ts              # GET all, DELETE read
│   │   │   ├── [id]/route.ts         # PATCH read, DELETE one
│   │   │   └── mark-all-read/route.ts # PATCH mark all
│   │   ├── cron/
│   │   │   └── notifications/route.ts # Cron job for reminders
│   │   └── transactions/route.ts      # Updated with budget checks
│   └── dashboard/
│       └── layout.tsx                 # Added NotificationToast
├── components/
│   ├── dashboard/
│   │   └── DashboardNav.tsx          # Added NotificationBell
│   └── notifications/
│       ├── NotificationBell.tsx      # Main UI component
│       └── NotificationToast.tsx     # Real-time toast alerts
├── lib/
│   └── notifications.ts              # Notification utilities
└── prisma/
    └── schema.prisma                 # Notification model + enum
```

## 🗄️ Database Schema

### NotificationType Enum
```prisma
enum NotificationType {
  REMINDER_OVERDUE
  REMINDER_DUE_SOON
  BUDGET_EXCEEDED
  GOAL_COMPLETED
  MONTHLY_SUMMARY
  SYSTEM
}
```

### Notification Model
```prisma
model Notification {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type        NotificationType
  title       String
  message     String
  
  // Link to related entity
  relatedId   String?
  relatedType String?        // 'reminder', 'category', 'goal'
  
  isRead      Boolean         @default(false)
  createdAt   DateTime        @default(now())
  
  @@index([userId, isRead])
  @@index([createdAt])
}
```

## 🔌 API Endpoints

### GET /api/notifications
Fetch user's notifications with optional filtering.

**Query Parameters:**
- `unreadOnly=true` - Only return unread notifications

**Response:**
```json
[
  {
    "id": "cm5abc123",
    "type": "REMINDER_DUE_SOON",
    "title": "Reminder Due Soon",
    "message": "Your reminder 'Pay rent' is due in 2 days",
    "relatedId": "cm5def456",
    "relatedType": "reminder",
    "isRead": false,
    "createdAt": "2024-01-13T10:30:00Z"
  }
]
```

### PATCH /api/notifications/[id]
Mark a specific notification as read.

**Response:**
```json
{
  "id": "cm5abc123",
  "isRead": true,
  ...
}
```

### DELETE /api/notifications/[id]
Delete a specific notification.

**Response:**
```json
{ "success": true }
```

### PATCH /api/notifications/mark-all-read
Mark all user's notifications as read.

**Response:**
```json
{ "success": true }
```

### DELETE /api/notifications
Delete all read notifications for the user.

**Response:**
```json
{ "success": true }
```

### GET /api/cron/notifications
Cron job endpoint to check for overdue/upcoming reminders.

**Response:**
```json
{
  "success": true,
  "overdueReminders": 3,
  "upcomingReminders": 5
}
```

## 🛠️ Utility Functions

### createNotification()
Create a new notification for a user.

```typescript
await createNotification({
  userId: 'user_123',
  type: 'GOAL_COMPLETED',
  title: 'Goal Completed! 🎉',
  message: 'You reached your goal "Emergency Fund"!',
  relatedId: 'goal_456',
  relatedType: 'goal',
});
```

### checkOverdueReminders()
Find all overdue reminders and create notifications.

```typescript
const count = await checkOverdueReminders();
console.log(`Created ${count} overdue reminder notifications`);
```

### checkUpcomingReminders()
Find reminders due within 3 days and create notifications.

```typescript
const count = await checkUpcomingReminders();
console.log(`Created ${count} upcoming reminder notifications`);
```

### checkCategoryBudget()
Check if a category budget has been exceeded after a transaction.

```typescript
const result = await checkCategoryBudget(categoryId, userId);
// { totalSpent: 1500, budget: 1000, exceeded: true }
```

### checkGoalCompletion()
Check if a goal has been completed and update status.

```typescript
const result = await checkGoalCompletion(goalId, userId);
// { totalSaved: 5000, targetAmount: 5000, completed: true }
```

## 🎨 UI Components

### NotificationBell
Main notification component with badge and dropdown.

**Features:**
- Unread count badge
- Dropdown with notification list
- Mark all as read button
- Individual notification actions
- Click to navigate to related entity
- Color-coded notification types
- Relative time display

**Usage:**
```tsx
import NotificationBell from '@/components/notifications/NotificationBell';

<NotificationBell />
```

### NotificationToast
Background component that shows toast notifications for new alerts.

**Features:**
- Polls for new notifications every 30 seconds
- Shows toast based on notification type
- Prevents duplicate toasts
- Auto-dismisses after 5 seconds

**Usage:**
```tsx
import NotificationToast from '@/components/notifications/NotificationToast';

<NotificationToast />
```

## 🔔 Notification Colors

| Type | Color | Icon Color |
|------|-------|------------|
| REMINDER_OVERDUE | Red | `text-red-500` |
| REMINDER_DUE_SOON | Yellow | `text-yellow-500` |
| BUDGET_EXCEEDED | Red | `text-red-500` |
| GOAL_COMPLETED | Green | `text-green-500` |
| MONTHLY_SUMMARY | Blue | `text-blue-500` |
| SYSTEM | Gray | `text-gray-500` |

## ⚡ Automated Triggers

### Transaction Created
When a new transaction is created:
1. Check if category budget exceeded → Create notification
2. Check if linked goals completed → Create notification + update goal status

### Cron Job (Recommended: Daily)
Set up a cron job to hit `/api/cron/notifications` daily:

```bash
# Example: Run daily at 8 AM
0 8 * * * curl https://your-app.com/api/cron/notifications
```

Or use a service like:
- **Vercel Cron**: Add to `vercel.json`
- **GitHub Actions**: Scheduled workflow
- **EasyCron**: External cron service

**Example Vercel Cron:**
```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## 📱 Mobile Responsive

All notification components are fully responsive:
- ✅ Touch-friendly dropdown
- ✅ Mobile notification panel (max-height with scroll)
- ✅ Notification bell in mobile nav
- ✅ Toast notifications optimized for mobile

## 🔐 Security

- ✅ **Authentication**: All routes require valid session
- ✅ **Authorization**: Users can only access their own notifications
- ✅ **Validation**: Server-side checks prevent unauthorized access
- ✅ **Cascade Delete**: Notifications deleted when user is deleted

## 🚀 Future Enhancements

### Monthly Summary Report
Generate and send monthly financial summaries:
- Total income vs expenses
- Top spending categories
- Budget performance
- Goal progress
- Savings rate

### Email Notifications
Send email alerts for critical notifications:
- Budget exceeded by 20%+
- Overdue reminders
- Goal milestones

### Push Notifications
Browser push notifications for real-time alerts:
- Service worker integration
- Push subscription management
- Opt-in/opt-out preferences

### Notification Preferences
User settings for notification types:
- Enable/disable by type
- Email vs in-app preference
- Quiet hours

### Smart Notifications
AI-powered insights:
- Spending pattern alerts
- Unusual transaction detection
- Savings recommendations
- Budget optimization suggestions

## 🧪 Testing

### Manual Testing Checklist

1. **Create Transaction**
   - [ ] Add expense that exceeds category budget
   - [ ] Verify budget exceeded notification appears
   - [ ] Check notification badge count increases

2. **Goal Completion**
   - [ ] Add transaction that completes a goal
   - [ ] Verify goal completed notification appears
   - [ ] Check goal status updated to COMPLETED

3. **Reminders**
   - [ ] Create reminder due tomorrow
   - [ ] Create reminder due 2 days from now
   - [ ] Create overdue reminder
   - [ ] Trigger cron job: GET /api/cron/notifications
   - [ ] Verify notifications created

4. **UI Interactions**
   - [ ] Click notification bell → dropdown opens
   - [ ] Click notification → navigates to related entity + marks as read
   - [ ] Click "Mark all read" → all marked as read, badge clears
   - [ ] Delete notification → removed from list
   - [ ] Click outside dropdown → closes

5. **Toast Notifications**
   - [ ] Create new notification (via transaction)
   - [ ] Verify toast appears with correct message
   - [ ] Wait 30 seconds → check for new notifications
   - [ ] Verify no duplicate toasts

## 📊 Migration

The notifications system was added via migration:

```bash
npx prisma migrate dev --name add_notifications
npx prisma generate
```

**Migration file:** `20260113054947_add_notifications`

## 🎯 Summary

The notifications system is now fully operational with:
- ✅ Database schema and models
- ✅ API routes for CRUD operations
- ✅ Automated triggers for transactions and reminders
- ✅ UI components with badge and dropdown
- ✅ Real-time toast notifications
- ✅ Smart deduplication
- ✅ Mobile responsive design
- ✅ Secure and user-scoped

Users will now receive timely alerts for:
- Overdue and upcoming reminders
- Budget limit violations
- Goal completion celebrations
- All with a beautiful, modern UI! 🎉
