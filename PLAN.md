# Personal Finance Manager - Feature Plan

## 🎯 PENDING FEATURES (To Implement)

### **Link Transactions to Goals**
**Status:** Planned - Not Yet Implemented  
**Description:** Allow users to link transactions to financial goals for automatic progress tracking.

**Current Behavior:**
- Users must manually edit goals to update `currentAmount`
- No connection between transactions and goal progress

**Proposed Solution:**
1. Add `goalId` field to Transaction model (optional)
2. Add "Link to Goal" dropdown in transaction create/edit form
3. When transaction is created with goalId:
   - Automatically update goal's `currentAmount`
   - Track which transactions contributed to goal
4. Show transaction history per goal
5. Support both income (adds to goal) and expense (if paying off debt goal)

**Implementation Steps:**
- [ ] Add migration: `goalId String?` to Transaction model
- [ ] Update transaction API to handle goalId
- [ ] Add goals dropdown to transaction form (new & edit)
- [ ] Create logic to auto-update goal progress when linked transaction created/updated/deleted
- [ ] Add "Linked Transactions" section in goal details page
- [ ] Handle edge cases (deleting linked transaction should reduce goal progress)

**Priority:** Medium (Nice to have for better UX)

---

## 🚨 MIGRATION PLAN (ON HOLD): NEXTJS TO TANSTACK + HONO

**Status:** Planning Phase  
**Target:** Split monolith into:
1. **Frontend:** TanStack Start + React + shadcn/ui + Tailwind CSS
2. **Backend:** Hono + PostgreSQL + TypeORM

---

## Migration Overview

This is a complete architectural migration from Next.js full-stack to a separated frontend/backend architecture:
- **Current:** Next.js App Router (Frontend + API Routes + Prisma + PostgreSQL)
- **Target:** TanStack Start (Frontend) + Hono (Backend API) + TypeORM + PostgreSQL

### Benefits
- ✅ Clear separation of concerns
- ✅ Independent scaling and deployment
- ✅ Better type safety across client-server boundary
- ✅ More flexible backend (Hono is lightweight and fast)
- ✅ Modern React patterns with TanStack ecosystem

---

## 📦 MIGRATION INVENTORY

### Frontend Pages (22 files → TanStack Routes)

#### Auth Pages (2)
- [ ] `src/app/auth/signin/page.tsx` → `frontend/src/app/auth/signin.tsx`
- [ ] `src/app/auth/signup/page.tsx` → `frontend/src/app/auth/signup.tsx`

#### Dashboard Pages (18)
- [ ] `src/app/dashboard/page.tsx` → `frontend/src/app/dashboard/index.tsx`
- [ ] `src/app/dashboard/accounts/page.tsx` → `frontend/src/app/dashboard/accounts/index.tsx`
- [ ] `src/app/dashboard/accounts/new/page.tsx` → `frontend/src/app/dashboard/accounts/new.tsx`
- [ ] `src/app/dashboard/accounts/[id]/page.tsx` → `frontend/src/app/dashboard/accounts/$id.tsx`
- [ ] `src/app/dashboard/transactions/page.tsx` → `frontend/src/app/dashboard/transactions/index.tsx`
- [ ] `src/app/dashboard/transactions/new/page.tsx` → `frontend/src/app/dashboard/transactions/new.tsx`
- [ ] `src/app/dashboard/categories/page.tsx` → `frontend/src/app/dashboard/categories/index.tsx`
- [ ] `src/app/dashboard/categories/new/page.tsx` → `frontend/src/app/dashboard/categories/new.tsx`
- [ ] `src/app/dashboard/recurring/page.tsx` → `frontend/src/app/dashboard/recurring/index.tsx`
- [ ] `src/app/dashboard/recurring/new/page.tsx` → `frontend/src/app/dashboard/recurring/new.tsx`
- [ ] `src/app/dashboard/recurring/[id]/page.tsx` → `frontend/src/app/dashboard/recurring/$id.tsx`
- [ ] `src/app/dashboard/goals/page.tsx` → `frontend/src/app/dashboard/goals/index.tsx`
- [ ] `src/app/dashboard/goals/new/page.tsx` → `frontend/src/app/dashboard/goals/new.tsx`
- [ ] `src/app/dashboard/goals/[id]/edit/page.tsx` → `frontend/src/app/dashboard/goals/$id/edit.tsx`
- [ ] `src/app/dashboard/analyze/page.tsx` → `frontend/src/app/dashboard/analyze.tsx`
- [ ] `src/app/dashboard/export/page.tsx` → `frontend/src/app/dashboard/export.tsx`
- [ ] `src/app/dashboard/settings/page.tsx` → `frontend/src/app/dashboard/settings.tsx`

#### Root Pages & Layouts (2)
- [ ] `src/app/page.tsx` → `frontend/src/app/index.tsx`
- [ ] `src/app/layout.tsx` → `frontend/src/app/__root.tsx`
- [ ] `src/app/dashboard/layout.tsx` → `frontend/src/app/dashboard/__layout.tsx`

---

### API Routes (22+ endpoints → Hono Routes)

#### Auth API (3)
- [ ] `src/app/api/auth/[...nextauth]/route.ts` → `backend/src/routes/auth.ts` (JWT auth)
- [ ] `src/app/api/auth/register/route.ts` → `backend/src/routes/auth.ts`
- [ ] `src/app/api/auth/complete-onboarding/route.ts` → `backend/src/routes/auth.ts`

#### Accounts API (2)
- [ ] `src/app/api/accounts/route.ts` (GET, POST) → `backend/src/routes/accounts.ts`
- [ ] `src/app/api/accounts/[id]/route.ts` (GET, PUT, DELETE) → `backend/src/routes/accounts.ts`

#### Transactions API (2)
- [ ] `src/app/api/transactions/route.ts` (GET, POST) → `backend/src/routes/transactions.ts`
- [ ] `src/app/api/transactions/[id]/route.ts` (GET, PUT, DELETE) → `backend/src/routes/transactions.ts`

#### Categories API (2)
- [ ] `src/app/api/categories/route.ts` (GET, POST) → `backend/src/routes/categories.ts`
- [ ] `src/app/api/categories/[id]/route.ts` (PUT, DELETE) → `backend/src/routes/categories.ts`

#### Recurring Transactions API (2)
- [ ] `src/app/api/recurring/route.ts` (GET, POST) → `backend/src/routes/recurring.ts`
- [ ] `src/app/api/recurring/[id]/route.ts` (PUT, DELETE) → `backend/src/routes/recurring.ts`
- [ ] `src/app/api/recurring/[id]/pause/route.ts` (POST) → `backend/src/routes/recurring.ts`

#### Goals API (2)
- [ ] `src/app/api/goals/route.ts` (GET, POST) → `backend/src/routes/goals.ts`
- [ ] `src/app/api/goals/[id]/route.ts` (GET, PUT, DELETE) → `backend/src/routes/goals.ts`

#### Analytics/Budget API (2)
- [ ] `src/app/api/analyze/route.ts` (GET) → `backend/src/routes/analytics.ts`
- [ ] `src/app/api/budget/route.ts` (GET) → `backend/src/routes/budget.ts`

#### User API (5)
- [ ] `src/app/api/user/export/route.ts` (GET) → `backend/src/routes/user.ts`
- [ ] `src/app/api/user/delete/route.ts` (DELETE) → `backend/src/routes/user.ts`
- [ ] `src/app/api/user/pin/route.ts` (GET, POST, PUT, DELETE) → `backend/src/routes/user.ts`
- [ ] `src/app/api/user/pin/check/route.ts` (GET) → `backend/src/routes/user.ts`
- [ ] `src/app/api/user/pin/verify/route.ts` (POST) → `backend/src/routes/user.ts`

#### Cron/Jobs API (1)
- [ ] `src/app/api/cron/recurring/route.ts` (GET, POST) → `backend/src/jobs/recurring.ts`

---

### Components (17 files - REUSABLE AS-IS! ✅)

All components can be moved directly with minimal changes:

#### UI Components (3) - shadcn/ui
- [ ] `src/components/ui/button.tsx` → `frontend/src/components/ui/button.tsx` ✅
- [ ] `src/components/ui/card.tsx` → `frontend/src/components/ui/card.tsx` ✅
- [ ] `src/components/ui/chart.tsx` → `frontend/src/components/ui/chart.tsx` ✅

#### Feature Components (14)
- [ ] `src/components/ThemeToggle.tsx` → `frontend/src/components/ThemeToggle.tsx` ✅
- [ ] `src/components/accounts/AccountCard.tsx` → `frontend/src/components/accounts/AccountCard.tsx` ✅
- [ ] `src/components/analyze/AnalyzeClient.tsx` → `frontend/src/components/analyze/AnalyzeClient.tsx`
- [ ] `src/components/dashboard/BudgetTracker.tsx` → `frontend/src/components/dashboard/BudgetTracker.tsx`
- [ ] `src/components/dashboard/DashboardNav.tsx` → `frontend/src/components/dashboard/DashboardNav.tsx`
- [ ] `src/components/dashboard/DashboardOverview.tsx` → `frontend/src/components/dashboard/DashboardOverview.tsx`
- [ ] `src/components/dashboard/GoalsTracker.tsx` → `frontend/src/components/dashboard/GoalsTracker.tsx`
- [ ] `src/components/export/ExportClient.tsx` → `frontend/src/components/export/ExportClient.tsx`
- [ ] `src/components/onboarding/OnboardingCheck.tsx` → `frontend/src/components/onboarding/OnboardingCheck.tsx`
- [ ] `src/components/onboarding/OnboardingWizard.tsx` → `frontend/src/components/onboarding/OnboardingWizard.tsx`
- [ ] `src/components/recurring/RecurringDetailsClient.tsx` → `frontend/src/components/recurring/RecurringDetailsClient.tsx`
- [ ] `src/components/settings/DeleteAccountModal.tsx` → `frontend/src/components/settings/DeleteAccountModal.tsx`
- [ ] `src/components/settings/SettingsClient.tsx` → `frontend/src/components/settings/SettingsClient.tsx`
- [ ] `src/components/transactions/TransactionsClient.tsx` → `frontend/src/components/transactions/TransactionsClient.tsx`

---

### Contexts (2 files - REUSABLE AS-IS! ✅)
- [ ] `src/contexts/AmountVisibilityContext.tsx` → `frontend/src/contexts/AmountVisibilityContext.tsx` ✅
- [ ] `src/contexts/ThemeContext.tsx` → `frontend/src/contexts/ThemeContext.tsx` ✅

---

### Lib/Utils (4 files)

#### Frontend Utils (Reusable)
- [ ] `src/lib/utils.ts` → `frontend/src/lib/utils.ts` ✅

#### Backend Utils (Need Migration)
- [ ] `src/lib/auth.ts` → `backend/src/lib/auth.ts` (NextAuth → JWT)
- [ ] `src/lib/prisma.ts` → `backend/src/lib/database.ts` (Prisma → TypeORM)
- [ ] `src/lib/onboarding.ts` → `backend/src/lib/onboarding.ts` (Adapt for new structure)

---

### Database Migration

#### Prisma → TypeORM
- [ ] `prisma/schema.prisma` → `backend/src/entities/*.ts` (TypeORM entities)
  - [ ] User entity
  - [ ] Account entity
  - [ ] Category entity
  - [ ] Transaction entity
  - [ ] RecurringTransaction entity
  - [ ] Goal entity

#### Migrations
- [ ] Copy existing Prisma migrations to TypeORM format
- [ ] Test data migration path

---

### Configuration Files

#### Frontend (TanStack Start)
- [ ] Create `frontend/vite.config.ts`
- [ ] Create `frontend/app.config.ts`
- [ ] Create `frontend/tsconfig.json`
- [ ] Migrate `tailwind.config.ts`
- [ ] Migrate `components.json` (shadcn config)
- [ ] Update `frontend/package.json`

#### Backend (Hono)
- [ ] Create `backend/tsconfig.json`
- [ ] Create `backend/package.json`
- [ ] Create `backend/src/index.ts` (Hono app entry)
- [ ] Setup TypeORM config
- [ ] Setup environment variables (.env)
- [ ] Setup CORS and middleware

#### Shared
- [ ] Update root `docker-compose.yml` (if needed)
- [ ] Create separate Dockerfiles for frontend/backend
- [ ] Update `.gitignore` files

---

### Types & Interfaces
- [ ] `src/types/index.ts` → Share between frontend/backend or duplicate
- [ ] Create shared types package (optional)

---

### Static Assets
- [ ] `public/*` → `frontend/public/*` ✅
- [ ] `src/app/globals.css` → `frontend/src/app/globals.css` ✅
- [ ] `src/app/favicon.ico` → `frontend/public/favicon.ico` ✅

---

## 🎯 MIGRATION PHASES

### Phase 1: Project Setup ✅ (User will create)
- [ ] Create `frontend/` folder
- [ ] Create `backend/` folder
- [ ] Initialize package.json in both

### Phase 2: Backend Migration (Hono + TypeORM)
**Priority: HIGH - Do this first for API stability**

1. **Setup Backend Infrastructure**
   - [ ] Install Hono, TypeORM, PostgreSQL dependencies
   - [ ] Create TypeORM entities from Prisma schema
   - [ ] Setup database connection
   - [ ] Create base Hono app with CORS

2. **Migrate Auth System**
   - [ ] Replace NextAuth with JWT-based auth
   - [ ] Create auth middleware
   - [ ] Implement register/login/logout
   - [ ] Session management

3. **Migrate API Routes to Hono**
   - [ ] Auth routes
   - [ ] User routes
   - [ ] Accounts routes
   - [ ] Transactions routes
   - [ ] Categories routes
   - [ ] Recurring transactions routes
   - [ ] Goals routes
   - [ ] Analytics/Budget routes
   - [ ] Cron/Jobs setup

4. **Testing**
   - [ ] Test all endpoints
   - [ ] Verify database operations
   - [ ] Check authentication flow

### Phase 3: Frontend Migration (TanStack Start)
**Priority: HIGH - After backend is stable**

1. **Setup Frontend Infrastructure**
   - [ ] Install TanStack Start, Router, React Query
   - [ ] Setup Vite config
   - [ ] Configure Tailwind CSS
   - [ ] Setup shadcn/ui

2. **Migrate Layouts & Root**
   - [ ] Convert `layout.tsx` to `__root.tsx`
   - [ ] Convert dashboard layout
   - [ ] Setup router configuration

3. **Migrate Pages**
   - [ ] Auth pages (signin, signup)
   - [ ] Dashboard home
   - [ ] Accounts pages
   - [ ] Transactions pages
   - [ ] Categories pages
   - [ ] Recurring pages
   - [ ] Goals pages
   - [ ] Analytics page
   - [ ] Export page
   - [ ] Settings page

4. **Migrate Components**
   - [ ] Copy all UI components
   - [ ] Copy all feature components
   - [ ] Update API calls to use new backend URLs
   - [ ] Update auth logic

5. **Migrate Contexts**
   - [ ] Theme context
   - [ ] Amount visibility context

6. **Testing**
   - [ ] Test all routes
   - [ ] Test authentication
   - [ ] Test data fetching
   - [ ] Test user flows

### Phase 4: Integration & Cleanup
- [ ] Environment variables setup
- [ ] Docker setup for both apps
- [ ] Production build testing
- [ ] Documentation updates
- [ ] Delete old Next.js code ✅ (User will do this)

---

## 📊 MIGRATION METRICS

**Total Items to Migrate:**
- Pages/Routes: 22
- API Endpoints: 22+
- Components: 17 (mostly reusable ✅)
- Contexts: 2 (reusable ✅)
- Database Entities: 6
- Config Files: ~10

**Estimated Complexity:**
- Backend: HIGH (Auth + TypeORM setup)
- Frontend: MEDIUM (TanStack routing patterns)
- Components: LOW (mostly copy-paste ✅)

**Estimated Timeline:**
- Phase 1: 1 hour (setup)
- Phase 2: 8-12 hours (backend)
- Phase 3: 6-10 hours (frontend)
- Phase 4: 2-4 hours (integration)
- **Total: 17-27 hours**

---

# Original Feature Plan (On Hold During Migration)

## Overview
Comprehensive roadmap for Personal Finance Manager application with 20 planned features, prioritized by impact and implementation order.

---

## 🎯 Foundation & UX (Priority 0)

### 0A. **Enhanced Authentication Pages**
**Description:** Improve login/signup experience with educational content and value proposition.
- Landing page with hero section explaining app benefits
- Feature highlights on login/signup pages
- Clear call-to-action buttons
- Responsive design for mobile and desktop
- Social proof elements (optional)
- Quick benefit summary (3-5 key features)
**Implementation Priority:** 0
**Estimated Complexity:** Low
**Required Changes:**
- Redesign src/app/auth/signin/page.tsx with hero section
- Redesign src/app/auth/signup/page.tsx with benefits
- Create reusable AuthLayout component
- Add benefit cards/sections

---

### 0B. **First-Time User Onboarding**
**Description:** Interactive tutorial for new users to get started quickly.
- Step-by-step onboarding wizard after first login
- Guided tour of key features
- Create first account/category/transaction walkthrough
- Optional interactive tooltips
- Skip/complete onboarding actions
- Persistent onboarding state (track completion)
- Celebrate first transaction milestone
**Implementation Priority:** 0
**Estimated Complexity:** Medium
**Required Changes:**
- Add onboardingCompleted flag to User model
- Create OnboardingWizard component
- Create onboarding API endpoint to track progress
- Add onboarding check on first dashboard visit
- Design onboarding steps and UI

---

## 🎯 High-Impact Features (Priority 1)

### 1. **Budget Tracker with Alerts**
**Description:** Allow users to set monthly budgets per category with visual progress tracking and alerts.
- Set monthly budget limit for each spending category
- Visual progress bars showing current spending vs budget limit
- Color-coded indicators (green <50%, yellow 50-80%, red >80%)
- Alert notifications when budget is exceeded
- Year-over-year budget comparison
- Budget history and trends
**Implementation Priority:** 1
**Estimated Complexity:** Medium
**Required Changes:** 
- Extend Category model with monthlyBudget field (already exists in schema)
- Create BudgetClient component with progress visualization
- Add budget alerts to dashboard
- API endpoint for budget management

---

### 2. **Financial Goals**
**Description:** Allow users to create and track savings goals with progress visualization.
- Create savings goals with target amount and deadline
- Track progress toward goals
- Visual progress indicators
- Estimated completion date based on current savings rate
- Goal history and completed goals archive
- Multiple active goals support
**Implementation Priority:** 2
**Estimated Complexity:** Medium
- New Goal model in Prisma schema
- GoalsClient component with progress tracking
- Goals dashboard widget
- API endpoints for CRUD operations

---

### 3. **Net Worth Dashboard**
**Description:** Calculate and display total net worth with historical tracking.
- Real-time net worth calculation (total assets - total liabilities)
- Historical net worth tracking and visualization
- Net worth trends over time (line chart)
- Asset allocation breakdown
- Monthly net worth snapshots
- Net worth goals and milestones
**Implementation Priority:** 3
**Estimated Complexity:** High
- Extend Account model to support asset/liability categorization
- NetWorthClient component with charts
- Historical data collection
- Analytics calculations

---

### 4. **Cash Flow Forecasting**
**Description:** Project future account balances based on recurring transactions.
- Project account balance for next 3/6/12 months
- Show when account will run low
- Visual forecast chart
- Scenario planning (what-if analysis)
- Alert when account reaches low threshold
- Income vs expense projections
**Implementation Priority:** 4
**Estimated Complexity:** High
- CashFlowClient component with projections
- Forecasting algorithm
- Historical data analysis
- Visualization charts

---

## 📊 Analytics & Reporting (Priority 2)

### 5. **Advanced Analytics Dashboard**
**Description:** Comprehensive spending analysis and insights.
- Spending trends (month-over-month growth percentage)
- Expense breakdown by category (pie, bar, heat map charts)
- Income sources analysis
- Savings rate calculation and trends
- Top spending categories
- Spending by account
- Time-based analysis (daily, weekly, monthly)
**Implementation Priority:** 5
**Estimated Complexity:** High
- AnalyticsClient enhancements
- Multiple chart types (pie, bar, heatmap)
- Complex data aggregation
- Performance optimization for large datasets

---

### 6. **Monthly Reports Generation**
**Description:** Auto-generate and export detailed financial reports.
- Summary of monthly income, expenses, savings
- Category breakdown
- Account summary
- Year-over-year comparison
- PDF export functionality
- Email delivery option
- Report scheduling
- Historical report storage
**Implementation Priority:** 6
**Estimated Complexity:** Medium
- ReportClient component
- PDF generation library (jsPDF)
- Report template design
- Scheduled job integration

---

### 7. **Spending Insights (AI-Powered)**
**Description:** Intelligent analysis and alerts for unusual spending patterns.
- Detect unusual spending patterns
- Generate insights like "You spent 40% more on groceries"
- Category-based spending alerts
- Trend notifications
- Smart recommendations
- Integration with Gemini API for AI analysis
- Historical comparison insights
**Implementation Priority:** 7
**Estimated Complexity:** High
- InsightsClient component
- AI integration (Gemini API)
- Pattern detection algorithms
- Notification system

---

## 💳 Account & Transaction Features (Priority 3)

### 8. **Credit Card Insights**
**Description:** Specialized tracking for credit card accounts.
- Credit utilization percentage and alerts
- Interest calculation estimation
- Rewards point tracking
- Available credit tracking
- Due date reminders
- Payment recommendations
- Credit score impact estimation
**Implementation Priority:** 8
**Estimated Complexity:** Medium
- Extend Account model for credit card fields
- CreditCardInsightsClient component
- Utilization calculation
- Interest calculation logic

---

### 9. **Bill Management System**
**Description:** Dedicated bill tracking and reminder system.
- Calendar view of upcoming bills
- Bill due date reminders
- Auto-link to recurring transactions
- Payment status tracking (paid, due, overdue)
- Bill history
- Average bill amount tracking
- Bill categorization
- Email/notification reminders
**Implementation Priority:** 9
**Estimated Complexity:** Medium
- New Bill model in schema
- BillClient component with calendar view
- Notification system integration
- Calendar integration (shadcn compatible)

---

### 10. **Account Reconciliation**
**Description:** Compare transactions with bank statements and ensure accuracy.
- Side-by-side transaction comparison
- Flag unreconciled transactions
- Reconciliation checklist per account/month
- Discrepancy highlighting
- Mark transactions as reconciled
- Reconciliation history
- Bulk reconciliation actions
**Implementation Priority:** 10
**Estimated Complexity:** Medium
- ReconciliationClient component
- Reconciliation status tracking
- Transaction matching logic
- UI for comparison view

---

## 📱 User Experience Enhancements (Priority 4)

### 11. **Enhanced Search & Filtering**
**Description:** Powerful transaction discovery and filtering.
- Multi-criteria search (date range, amount, category, account, note)
- Save frequent searches as filters
- Transaction tagging/labeling
- Filter history
- Quick filters (last 7 days, untagged, high amount)
- Saved filter management
- Export filtered results
**Implementation Priority:** 11
**Estimated Complexity:** Medium
- SearchClient component improvements
- Advanced filter UI
- Saved filters storage
- Filter persistence

---

### 12. **Mobile Optimizations**
**Description:** Ensure excellent mobile experience.
- Responsive chart layouts
- Floating action button for quick-add transaction
- Touch-optimized navigation
- Swipe gestures support
- Mobile-specific views
- Optimized form inputs
- Bottom sheet modals
**Implementation Priority:** 12
**Estimated Complexity:** Medium
- Component responsive design review
- Mobile-specific components
- Gesture library integration
- Performance optimization

---

### 13. **Smart Notifications System**
**Description:** Intelligent alerts for important financial events.
- Large transaction alerts (threshold-based)
- Budget exceeded notifications
- Bill due reminders
- Unusual spending alerts
- Recurring transaction notifications
- Goal milestones reached
- Account low balance warnings
- Push notifications support
**Implementation Priority:** 13
**Estimated Complexity:** Medium
- NotificationClient component
- Notification preferences/settings
- Backend notification service
- Push notification integration

---

## 🔧 Integration Features (Priority 5)

### 14. **CSV/Bank Import**
**Description:** Import transactions from bank exports.
- CSV file upload and parsing
- Bank statement format support (multiple formats)
- Smart category mapping
- Duplicate detection and prevention
- Data validation
- Import preview before confirmation
- Import history
- Bulk import handling
**Implementation Priority:** 14
**Estimated Complexity:** Medium-High
- ImportClient component
- CSV parsing library
- Duplicate detection algorithm
- Data mapping engine

---

### 15. **Receipt Management**
**Description:** Store and manage receipt images for transactions.
- Upload receipt image for each transaction
- Receipt storage and retrieval
- Image compression and optimization
- Receipt thumbnail preview
- Receipt search by transaction
- Bulk receipt management
- Image annotation capability
**Implementation Priority:** 15
**Estimated Complexity:** Medium
- File upload handling
- Cloud storage integration (optional)
- ReceiptClient component
- Image compression library

---

### 16. **API/Third-Party Integrations**
**Description:** Connect with external services and APIs.
- Bank API connections (Plaid for bank sync)
- Integration with other finance apps
- Webhook support for third-party tools
- Export to accounting software
- Integration management UI
- Connected accounts overview
**Implementation Priority:** 16
**Estimated Complexity:** High
- Integration middleware
- OAuth/API key management
- Webhook handlers
- Data sync logic

---

## 💡 Advanced Features (Priority 6)

### 17. **Tax Report Generator**
**Description:** Generate tax-relevant financial reports.
- Categorize transactions as tax-relevant
- Income summary by source
- Deductible expenses summary
- Tax form generation (1099, Schedule C support)
- Capital gains tracking
- Quarterly tax estimates
- Tax year report export
**Implementation Priority:** 17
**Estimated Complexity:** High
- TaxReportClient component
- Tax category mapping
- Report generation logic
- PDF export formatting

---

### 18. **Investment Portfolio Tracking**
**Description:** Track investment accounts and performance.
- Add investment accounts (stocks, crypto, ETFs)
- Hold tracking (quantity, purchase price)
- Current value and gain/loss calculation
- Portfolio allocation visualization
- Dividend tracking
- Performance metrics (ROI, YTD return)
- Transaction history for investments
- Integration with market data APIs
**Implementation Priority:** 18
**Estimated Complexity:** High
- InvestmentClient component
- Market data API integration
- Portfolio calculation logic
- Advanced charts

---

### 19. **Subscription Manager**
**Description:** Track all recurring subscriptions.
- Subscription list with amounts and renewal dates
- Cost analysis by subscription type
- Alert for upcoming renewals
- Subscription lifecycle tracking
- Spending by subscription service
- Unused subscription detection
- Cancellation reminders
**Implementation Priority:** 19
**Estimated Complexity:** Medium
- SubscriptionClient component
- Subscription categorization
- Renewal tracking
- Analytics on subscriptions

---

### 20. **Multi-Currency Support**
**Description:** Handle accounts in different currencies.
- Multi-currency account support
- Automatic currency conversion
- Exchange rate tracking
- Home currency designation
- Currency conversion history
- Consolidated net worth in home currency
- Real-time exchange rates
- Currency preference settings
**Implementation Priority:** 20
**Estimated Complexity:** High
- Currency model in schema
- Exchange rate API integration
- Conversion calculations
- Currency-aware components

---

## Implementation Order Summary

### Phase 1 (Quick Wins - Weeks 1-2)
1. Budget Tracker with Alerts ✓
2. Financial Goals ✓
3. Enhanced Search & Filtering ✓

### Phase 2 (Core Features - Weeks 3-4)
4. Net Worth Dashboard ✓
5. Cash Flow Forecasting ✓
6. Advanced Analytics Dashboard ✓

### Phase 3 (Enhanced UX - Weeks 5-6)
7. Smart Notifications System ✓
8. Mobile Optimizations ✓
9. Monthly Reports Generation ✓

### Phase 4 (Integrations - Weeks 7-8)
10. CSV/Bank Import ✓
11. Credit Card Insights ✓
12. Bill Management System ✓

### Phase 5 (Advanced - Weeks 9-10)
13. Spending Insights (AI) ✓
14. Receipt Management ✓
15. Account Reconciliation ✓

### Phase 6 (Premium Features - Weeks 11-12)
16. Tax Report Generator ✓
17. Investment Portfolio Tracking ✓
18. Subscription Manager ✓
19. Multi-Currency Support ✓
20. API/Third-Party Integrations ✓

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16 with App Router
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Charts:** Recharts (already integrated)
- **Forms:** React Hook Form
- **File Upload:** React Dropzone
- **PDF Generation:** jsPDF/html2pdf
- **Notifications:** Custom + Push Notifications API
- **Gestures:** react-use-gesture (for mobile)

### Backend
- **Runtime:** Node.js with Next.js API routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js (already setup)
- **AI Integration:** Google Gemini API
- **External APIs:** Plaid (bank sync), Exchange Rate APIs
- **File Storage:** Vercel Blob or AWS S3
- **Task Scheduling:** node-cron or Bull Queue

### Databases/Models to Extend
- Category (extend with monthlyBudget - already exists)
- Account (extend with asset/liability type)
- New models: Goal, Bill, Reconciliation, Receipt, Subscription, Investment

---

## Edge Cases & Considerations

### Data Validation
- Budget limits must be positive numbers
- Date ranges must be valid
- Currency conversions must handle zero/negative rates
- Import duplicates based on date, amount, description
- Receipt files max size 5MB, only images

### Performance
- Pagination for large transaction lists
- Lazy loading for charts
- Caching for exchange rates (update daily)
- Aggregate calculations for historical data
- Optimize queries for large datasets

### User Experience
- Confirmation dialogs for destructive actions
- Loading states for async operations
- Error handling with user-friendly messages
- Empty states with helpful guidance
- Undo functionality where applicable

### Security
- Validate all file uploads
- Rate limit import operations
- Secure API key storage for integrations
- RBAC for subscription management
- Sanitize user input in search/filters
