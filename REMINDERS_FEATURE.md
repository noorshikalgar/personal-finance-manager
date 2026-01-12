# Reminders Feature

## Overview
Track recurring expenses, maintenance schedules, and important dates with file attachments.

## Features
- ✅ Recurring schedules (Daily, Weekly, Monthly, Quarterly, Half-Yearly, Yearly, Custom)
- ✅ Expense tracking with estimated amounts
- ✅ File attachments (receipts, bills, photos, PDFs)
- ✅ Transaction history per reminder
- ✅ Analytics and spending patterns
- ✅ Status management (Upcoming, Overdue, Snoozed, Completed)
- ✅ Category linking for budget tracking
- ✅ Dashboard widget for upcoming/overdue reminders

## Use Cases

### Maintenance Tracking
- Bike servicing every 3 months
- Car oil change every 5,000 miles
- AC filter replacement every 6 months
- Property maintenance schedules

### Bills & Subscriptions
- Insurance premiums (yearly)
- Rent/mortgage payments (monthly)
- Utility bills (monthly)
- Software subscriptions (monthly/yearly)

### Health & Medical
- Medicine refills
- Doctor appointments
- Health checkups (yearly)
- Vaccination reminders

### Personal Milestones
- Birthday reminders
- Anniversary dates
- License renewals
- Passport expiration

## Navigation
- **Main:** Dashboard → More → Reminders
- **Widget:** Dashboard home page (shows next 5 upcoming/overdue)

## Pages

### Reminders List
`/dashboard/reminders`
- View all reminders
- Filter by status (All, Upcoming, Overdue)
- Quick status indicators
- Transaction and attachment counts
- Click to view details

### Reminder Details
`/dashboard/reminders/[id]`

**Tabs:**
1. **Overview**
   - Schedule details (frequency, next date, status)
   - Expense summary (estimated vs actual spent)
   - Category information

2. **Transactions**
   - All transactions linked to this reminder
   - Click to navigate to transaction details
   - Shows amount, date, category

3. **Analytics** (Coming Soon)
   - Spending trends over time
   - Average cost per occurrence
   - Budget vs actual comparison

4. **Attachments**
   - Upload bills, receipts, photos, PDFs
   - View/download files
   - Delete attachments
   - File size and type indicators

### Create Reminder
`/dashboard/reminders/new`

**Required Fields:**
- Title (e.g., "Bike Servicing")
- Frequency (Daily, Weekly, Monthly, etc.)
- Next Due Date

**Optional Fields:**
- Description
- Custom cycle days (if frequency is "Custom")
- Is Expense toggle
- Estimated Amount (if expense)
- Category (if expense)

### Edit Reminder
`/dashboard/reminders/[id]/edit`
- Update all reminder details
- Change status (Upcoming, Overdue, Snoozed, Completed)
- Modify schedule and expense information

## API Endpoints

### Reminders CRUD
- `GET /api/reminders` - List all reminders
  - Query params: `status`, `includeCompleted`
- `POST /api/reminders` - Create new reminder
- `GET /api/reminders/[id]` - Get reminder details
- `PATCH /api/reminders/[id]` - Update reminder
- `DELETE /api/reminders/[id]` - Delete reminder

### File Attachments
- `GET /api/reminders/[id]/attachments` - List attachments
- `POST /api/reminders/[id]/attachments` - Upload file
- `GET /api/reminders/[id]/attachments/[attachmentId]` - Download file
- `DELETE /api/reminders/[id]/attachments/[attachmentId]` - Delete attachment

## Database Schema

### Reminder Model
```prisma
model Reminder {
  id                 String              @id @default(cuid())
  title              String
  description        String?
  cycle              ReminderCycle       // Frequency
  customCycleDays    Int?                // For custom frequency
  nextDate           DateTime            // Next due date
  lastCompletedDate  DateTime?
  status             ReminderStatus      @default(UPCOMING)
  isExpense          Boolean             @default(false)
  estimatedAmount    Float?
  totalSpent         Float               @default(0)
  categoryId         String?
  userId             String
  
  // Relations
  user               User                @relation(...)
  category           Category?           @relation(...)
  transactions       Transaction[]
  attachments        ReminderAttachment[]
  
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  
  @@index([userId, status, nextDate])
}
```

### ReminderAttachment Model
```prisma
model ReminderAttachment {
  id               String    @id @default(cuid())
  reminderId       String
  fileName         String
  fileType         String    // MIME type
  fileSize         Int       // bytes
  storageProvider  String    // local, s3, wasabi, r2
  storageKey       String    // UUID or S3 key
  uploadedAt       DateTime  @default(now())
  
  reminder         Reminder  @relation(...)
  
  @@index([reminderId])
}
```

### Enums
```prisma
enum ReminderCycle {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  HALF_YEARLY
  YEARLY
  CUSTOM
}

enum ReminderStatus {
  UPCOMING
  OVERDUE
  COMPLETED
  SNOOZED
}
```

## File Storage
See [REMINDERS_STORAGE.md](./REMINDERS_STORAGE.md) for detailed configuration.

**Supported Providers:**
- Local (development)
- Wasabi (recommended for production)
- AWS S3
- Cloudflare R2

**Supported File Types:**
- Images: JPEG, PNG, WebP (auto-optimized to 1920x1080, 85% quality)
- Documents: PDF

**Size Limits:**
- Images: 5MB
- PDFs: 10MB

## Security

### Authentication
- All endpoints require active session
- Owner-only access to reminders and attachments

### File Access
- Files downloaded through authenticated API endpoint
- Direct storage URLs not exposed
- Owner verification on every request

### Validation
- File type whitelist
- Size limit enforcement
- Input sanitization for all fields

## UI Components

### RemindersWidget
Dashboard widget showing next 5 upcoming/overdue reminders
- Location: `/src/components/dashboard/RemindersWidget.tsx`
- Used in: `/src/app/dashboard/page.tsx`
- Auto-refreshes on mount
- Click to navigate to detail page

### Status Indicators
- **Overdue:** Red badge + AlertCircle icon
- **Upcoming:** Blue badge
- **Snoozed:** Yellow badge
- **Completed:** Green badge

### File Upload
- Drag & drop support (future)
- File type and size validation
- Progress indicator during upload
- Auto-optimization for images

## Future Enhancements
- [ ] Email notifications for upcoming reminders
- [ ] Push notifications
- [ ] Recurring expense auto-linking to transactions
- [ ] Bulk file upload
- [ ] Drag & drop file upload
- [ ] Analytics charts (spending trends)
- [ ] Snooze with custom duration
- [ ] Reminder templates (common use cases)
- [ ] Calendar view integration
- [ ] Export reminder history to PDF
- [ ] Smart expense predictions based on history

## Testing

### Manual Testing Checklist
- [ ] Create reminder with all fields
- [ ] Create reminder with minimal fields
- [ ] Upload image attachment
- [ ] Upload PDF attachment
- [ ] Download attachment
- [ ] Delete attachment
- [ ] Edit reminder
- [ ] Change reminder status
- [ ] Link transaction to reminder
- [ ] View analytics tab
- [ ] Delete reminder (verify files deleted)
- [ ] Filter reminders by status
- [ ] Dashboard widget displays correctly
- [ ] Overdue reminders show red indicator

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# List reminders
curl -X GET http://localhost:3001/api/reminders \
  -H "Cookie: next-auth.session-token=..."

# Create reminder
curl -X POST http://localhost:3001/api/reminders \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "title": "Bike Servicing",
    "cycle": "QUARTERLY",
    "nextDate": "2025-04-01",
    "isExpense": true,
    "estimatedAmount": 150,
    "categoryId": "..."
  }'

# Upload attachment
curl -X POST http://localhost:3001/api/reminders/[id]/attachments \
  -H "Cookie: next-auth.session-token=..." \
  -F "file=@/path/to/receipt.jpg"
```

## Troubleshooting

### Files Not Uploading
1. Check file size (max 5MB for images, 10MB for PDFs)
2. Verify file type is supported
3. Ensure `STORAGE_PROVIDER` is configured
4. Check server logs for errors

### Reminders Not Showing
1. Verify user is logged in
2. Check reminder filters (status)
3. Inspect network tab for API errors
4. Verify database has reminders for user

### Attachments Not Downloading
1. Verify user owns the reminder
2. Check storage provider configuration
3. Ensure file exists in storage
4. Check network connectivity

## Development Notes

### Adding New Reminder Cycles
1. Add to `ReminderCycle` enum in `prisma/schema.prisma`
2. Run `npx prisma migrate dev`
3. Update cycle selection in create/edit forms
4. Update `formatCycle` function in list/detail pages

### Adding New Storage Providers
See [REMINDERS_STORAGE.md](./REMINDERS_STORAGE.md) for implementation guide.

### Extending Analytics
Analytics tab currently shows placeholder. To implement:
1. Create analytics API endpoint
2. Calculate trends from transaction history
3. Build charts using Chart.js or Recharts
4. Add to detail page analytics tab

## Performance Considerations

### Database Indexes
- `userId, status, nextDate` for efficient reminder queries
- `reminderId` for quick attachment lookups

### File Optimization
- Images automatically compressed to reduce storage costs
- Lazy loading for attachment lists
- Pagination for large attachment lists (future)

### Caching
- Dashboard widget cached for 5 minutes (future)
- File metadata cached in database
- Consider CDN for file delivery (future)

---

**Questions or issues?** Check the troubleshooting section or review the API documentation.
