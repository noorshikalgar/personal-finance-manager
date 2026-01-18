# Financial Planner Feature - Detailed Specification

## Overview
A forward-looking financial planning system that allows users to plan their finances for future months, set budgets, project income/expenses, and track planned vs actual performance.

---

## 1. Core Concept

Users can plan their finances for any future month by:
- Setting budget allocations for each category
- Planning expected income sources
- Scheduling planned expenses
- Setting monthly goals
- Creating "what-if" scenarios

When the planned month arrives, users can:
- Compare planned vs actual spending
- Track variance and deviations
- Get insights on planning accuracy
- Improve future planning based on past patterns

---

## 2. Data Model (Prisma Schema)

### Budget Plan Model
```prisma
model BudgetPlan {
  id                String              @id @default(cuid())
  userId            String
  user              User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Time Period
  month             Int                 // 1-12
  year              Int                 // 2024, 2025, etc.
  
  // Plan Metadata
  planName          String?             // Optional: "Conservative Plan", "Vacation Month", etc.
  description       String?
  
  // Income Planning
  plannedIncome     Float               @default(0)
  incomeBreakdown   Json?               // { "salary": 50000, "freelance": 10000, etc. }
  
  // Expense Planning
  plannedExpenses   Float               @default(0)
  
  // Savings & Goals
  plannedSavings    Float               @default(0)
  savingsRate       Float?              // Target savings rate %
  
  // Status
  status            PlanStatus          @default(DRAFT)
  isActive          Boolean             @default(true)
  
  // Tracking (when month arrives)
  actualIncome      Float?              @default(0)
  actualExpenses    Float?              @default(0)
  actualSavings     Float?              @default(0)
  variance          Float?              // Planned vs Actual difference
  
  // Template/Copy features
  copiedFromPlanId  String?             // If created from template
  isTemplate        Boolean             @default(false)
  templateName      String?
  
  // Relations
  categoryBudgets   CategoryBudget[]    // Category-wise budget breakdown
  plannedTransactions PlannedTransaction[]
  milestones        PlanMilestone[]
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  @@unique([userId, month, year])
  @@index([userId, year, month])
  @@index([status])
}

enum PlanStatus {
  DRAFT           // Being created/edited
  ACTIVE          // Plan is set for the month
  IN_PROGRESS     // Month has started, tracking in progress
  COMPLETED       // Month ended, final comparison done
  ARCHIVED        // Old plan, archived
}

model CategoryBudget {
  id              String        @id @default(cuid())
  planId          String
  plan            BudgetPlan    @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  categoryId      String
  category        Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  // Budget amounts
  plannedAmount   Float         // Budgeted for this category
  actualAmount    Float?        @default(0) // Actual spent (auto-calculated from transactions)
  
  // Tracking
  percentUsed     Float?        // (actual / planned) * 100
  isOverBudget    Boolean       @default(false)
  
  // Notes
  notes           String?
  priority        Int?          // 1-5, for importance
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@unique([planId, categoryId])
  @@index([planId])
}

model PlannedTransaction {
  id              String        @id @default(cuid())
  planId          String
  plan            BudgetPlan    @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  // Transaction details
  title           String        // "Rent Payment", "Salary Credit", etc.
  description     String?
  amount          Float
  type            String        // INCOME / EXPENSE
  categoryId      String?
  category        Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  
  // Expected date
  expectedDate    DateTime
  
  // Tracking
  isCompleted     Boolean       @default(false)
  actualTransactionId String?   @unique
  actualTransaction Transaction? @relation(fields: [actualTransactionId], references: [id], onDelete: SetNull)
  actualAmount    Float?
  actualDate      DateTime?
  variance        Float?        // Difference between planned and actual
  
  // Recurrence
  isRecurring     Boolean       @default(false)
  recurringId     String?       // Link to RecurringTransaction if applicable
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([planId])
  @@index([expectedDate])
}

model PlanMilestone {
  id              String        @id @default(cuid())
  planId          String
  plan            BudgetPlan    @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  title           String        // "Save ₹10,000", "Pay off credit card"
  description     String?
  targetAmount    Float?
  targetDate      DateTime?
  
  isCompleted     Boolean       @default(false)
  completedAt     DateTime?
  
  priority        Int?          // 1-5
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  @@index([planId])
}
```

---

## 3. User Interface Components

### 3.1 Planner Dashboard (`/dashboard/planner`)

**Monthly Timeline View:**
- Horizontal calendar showing 12 months ahead
- Each month card shows:
  - Month & Year
  - Plan status badge (Draft/Active/In Progress/Completed)
  - Planned income
  - Planned expenses
  - Planned savings
  - Quick action: "View Plan" or "Create Plan"
- Current month highlighted
- Past months slightly dimmed

**Quick Stats (for currently selected month):**
- 📊 Planned Budget: ₹X,XXX
- 💰 Expected Income: ₹X,XXX
- 💸 Planned Expenses: ₹X,XXX
- 💎 Planned Savings: ₹X,XXX (XX%)
- If month has started: Show Actual vs Planned comparison

**Action Buttons:**
- "Create New Plan" - for future month
- "Copy Current Month" - duplicate current budget to future month
- "Use Template" - apply saved template
- "View All Plans"

---

### 3.2 Create/Edit Plan Page (`/dashboard/planner/[month]/[year]`)

**Header:**
- Month & Year selector (future months only for new plans)
- Plan name (optional text input)
- Status dropdown (Draft/Active)
- Save as Template checkbox

**Step 1: Income Planning**
```
┌─────────────────────────────────────────────┐
│ 💰 Plan Your Income for February 2026      │
├─────────────────────────────────────────────┤
│                                             │
│ Income Sources:                             │
│ ┌─────────────────┬──────────────────────┐ │
│ │ Source          │ Amount               │ │
│ ├─────────────────┼──────────────────────┤ │
│ │ Salary          │ ₹ 50,000   [x]       │ │
│ │ Freelance       │ ₹ 15,000   [x]       │ │
│ │ Investment      │ ₹  2,000   [x]       │ │
│ │ + Add Source                           │ │
│ └─────────────────┴──────────────────────┘ │
│                                             │
│ Total Planned Income: ₹67,000               │
│                                             │
│ [Copy from last month] [Use Average]       │
└─────────────────────────────────────────────┘
```

**Step 2: Category Budgets**
```
┌─────────────────────────────────────────────┐
│ 📊 Set Category Budgets                    │
├─────────────────────────────────────────────┤
│                                             │
│ Category        Budget    Priority  Notes  │
│ ┌────────────────────────────────────────┐ │
│ │ 🏠 Rent        ₹15,000   ⭐⭐⭐⭐⭐    │ │
│ │ 🍔 Food        ₹ 8,000   ⭐⭐⭐⭐     │ │
│ │ 🚗 Transport   ₹ 3,000   ⭐⭐⭐       │ │
│ │ 🎬 Entertainment ₹2,000   ⭐⭐        │ │
│ │ 💡 Utilities   ₹ 2,500   ⭐⭐⭐       │ │
│ │ + Add Category                         │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ Total Budgeted: ₹30,500                     │
│ Remaining: ₹36,500 (54%)                    │
│                                             │
│ Suggested allocation:                       │
│ • 50% Needs (₹33,500) ← Current: ₹30,500 ✓ │
│ • 30% Wants (₹20,100) ← Set ₹0             │
│ • 20% Savings (₹13,400) ← Set ₹0           │
│                                             │
│ [Quick Fill] [Auto-suggest from history]   │
└─────────────────────────────────────────────┘
```

**Step 3: Planned Transactions (Optional)**
```
┌─────────────────────────────────────────────┐
│ 📝 Schedule Expected Transactions           │
├─────────────────────────────────────────────┤
│                                             │
│ Add specific transactions you're expecting: │
│                                             │
│ ┌─ Planned Income ──────────────────────┐  │
│ │ Feb 1  │ Salary        │ ₹50,000  │ ✓ │  │
│ │ Feb 15 │ Freelance     │ ₹15,000  │ ✓ │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ ┌─ Planned Expenses ────────────────────┐  │
│ │ Feb 1  │ Rent          │ ₹15,000  │ ✓ │  │
│ │ Feb 5  │ Credit Card   │ ₹ 8,000  │ ✓ │  │
│ │ Feb 10 │ Utilities     │ ₹ 2,500  │ ✓ │  │
│ │ Feb 28 │ Insurance     │ ₹ 3,000  │   │  │
│ └───────────────────────────────────────┘  │
│                                             │
│ [+ Add Planned Transaction]                 │
│ [Import from Recurring Transactions]        │
└─────────────────────────────────────────────┘
```

**Step 4: Savings & Goals**
```
┌─────────────────────────────────────────────┐
│ 💎 Savings Plan                             │
├─────────────────────────────────────────────┤
│                                             │
│ Target Savings: ₹ 15,000                    │
│ Savings Rate: 22.4% of income               │
│                                             │
│ Link to Goals: (optional)                   │
│ ☑ Emergency Fund - ₹10,000                  │
│ ☑ Vacation 2026  - ₹ 5,000                  │
│ ☐ New Laptop                                │
│                                             │
│ Milestones for this month:                  │
│ • Save ₹15,000 by month-end                 │
│ • Pay off credit card (₹8,000)              │
│ • [+ Add milestone]                         │
└─────────────────────────────────────────────┘
```

**Summary Panel (Sticky Sidebar):**
```
┌─────────────────────────┐
│ Plan Summary            │
├─────────────────────────┤
│ Income:   ₹67,000       │
│ Expenses: ₹30,500       │
│ Savings:  ₹15,000       │
│ Buffer:   ₹21,500       │
│                         │
│ Savings Rate: 22.4%     │
│                         │
│ [Save Draft]            │
│ [Activate Plan]         │
└─────────────────────────┘
```

**Actions:**
- Save as Draft
- Activate Plan (locks major changes, plan becomes active)
- Copy to Another Month
- Save as Template
- Discard

---

### 3.3 View Plan Page (`/dashboard/planner/[month]/[year]/view`)

**Header:**
- Month & Year
- Plan status badge
- Edit button (if not completed)
- Delete button (if draft)

**Status-based Views:**

#### For DRAFT/ACTIVE Plans (future months):
- Show planned budget as set
- Display all category budgets
- List planned transactions
- Show milestones

#### For IN_PROGRESS Plans (current month):
**Comparison Dashboard:**
```
┌──────────────────────────────────────────────────┐
│ February 2026 - Plan vs Actual                   │
├──────────────────────────────────────────────────┤
│                                                  │
│ 💰 Income                                        │
│ Planned: ₹67,000  │  Actual: ₹65,000  │ -₹2,000 │
│ ████████████████████░░ 97%                       │
│                                                  │
│ 💸 Expenses                                      │
│ Planned: ₹30,500  │  Actual: ₹28,200  │ -₹2,300 │
│ ████████████████░░░░░░ 92% ✓ Under Budget       │
│                                                  │
│ 💎 Savings                                       │
│ Planned: ₹15,000  │  Actual: ₹17,500  │ +₹2,500 │
│ ██████████████████████ 117% ✓ Ahead of Plan     │
└──────────────────────────────────────────────────┘
```

**Category-wise Breakdown:**
```
Category         Planned    Actual    Variance    %    Status
─────────────────────────────────────────────────────────────
🏠 Rent          ₹15,000   ₹15,000     ₹0       100%   ✓
🍔 Food          ₹ 8,000   ₹ 9,200   +₹1,200    115%   ⚠️
🚗 Transport     ₹ 3,000   ₹ 2,100   -₹  900     70%   ✓
🎬 Entertainment ₹ 2,000   ₹ 1,500   -₹  500     75%   ✓
💡 Utilities     ₹ 2,500   ₹ 2,400   -₹  100     96%   ✓
─────────────────────────────────────────────────────────────
Total            ₹30,500   ₹30,200   -₹  300     99%   ✓
```

**Planned vs Actual Transactions:**
```
Planned Transactions:
┌─────────────────────────────────────────────────┐
│ Feb 5  │ Credit Card   │ ₹8,000  │ Matched ✓   │
│        └─ Actual: Feb 5, ₹8,000                │
│                                                 │
│ Feb 10 │ Utilities     │ ₹2,500  │ Matched ✓   │
│        └─ Actual: Feb 11, ₹2,400 (-₹100)       │
│                                                 │
│ Feb 28 │ Insurance     │ ₹3,000  │ Pending ⏳   │
│        └─ Due in 11 days                        │
└─────────────────────────────────────────────────┘

Unplanned Transactions:
┌─────────────────────────────────────────────────┐
│ Feb 8  │ Restaurant    │ ₹1,200  │ ⚠️ Extra    │
│ Feb 14 │ Gifts         │ ₹  800  │ ⚠️ Extra    │
└─────────────────────────────────────────────────┘
```

**Progress & Insights:**
- Days elapsed: 14/28 (50%)
- Budget used: 92% of planned
- On track for savings goal ✓
- Spending pace: Projected ₹32,400 by month-end (slightly over)

**Milestones:**
- ✓ Save ₹15,000 by month-end (₹17,500 saved, 117%)
- ⏳ Pay off credit card (₹8,000) - Completed on Feb 5
- ✓ All milestones achieved!

#### For COMPLETED Plans (past months):
- Final comparison view
- Planning accuracy score
- Lessons learned (auto-generated insights)
- Export report

---

### 3.4 Quick Plan Templates

**System Templates:**
1. **50/30/20 Budget**
   - 50% Needs
   - 30% Wants
   - 20% Savings

2. **Conservative Saver**
   - 60% Needs
   - 10% Wants
   - 30% Savings

3. **Aggressive Saver**
   - 45% Needs
   - 15% Wants
   - 40% Savings

4. **Debt Payoff Focus**
   - 50% Needs
   - 20% Wants
   - 30% Debt/Savings

**User Templates:**
- Users can save their plans as templates
- Reuse templates for future months
- Edit templates

---

### 3.5 Planner Analytics Page (`/dashboard/planner/analytics`)

**Planning Accuracy Over Time:**
- Line chart: Planned vs Actual over past 6-12 months
- Income accuracy trend
- Expense accuracy trend
- Savings achievement rate

**Best/Worst Categories:**
- Categories most over/under budget
- Most predictable categories
- Most volatile categories

**Planning Score:**
- Overall planning accuracy: 87%
- Income prediction: 92%
- Expense prediction: 85%
- Savings achievement: 94%

**Insights:**
- "You typically overspend on Food by 15%"
- "Your income is very predictable (98% accuracy)"
- "You consistently save more than planned ✓"
- "Consider increasing Food budget by ₹1,000"

**Recommendations:**
- Suggest budget adjustments based on historical data
- Identify areas to improve planning
- Highlight successful planning patterns

---

## 4. Business Logic & Workflows

### 4.1 Create Plan Workflow
```typescript
async function createBudgetPlan(data: CreatePlanInput) {
  // 1. Validate month is in future (or current)
  const targetDate = new Date(data.year, data.month - 1);
  if (isBefore(targetDate, startOfMonth(new Date()))) {
    throw new Error("Cannot create plan for past months");
  }
  
  // 2. Check if plan already exists
  const existing = await prisma.budgetPlan.findUnique({
    where: {
      userId_month_year: {
        userId: data.userId,
        month: data.month,
        year: data.year
      }
    }
  });
  
  if (existing) {
    throw new Error("Plan already exists for this month");
  }
  
  // 3. Create plan
  const plan = await prisma.budgetPlan.create({
    data: {
      userId: data.userId,
      month: data.month,
      year: data.year,
      planName: data.planName,
      plannedIncome: data.plannedIncome,
      plannedExpenses: data.plannedExpenses,
      plannedSavings: data.plannedSavings,
      status: data.status || 'DRAFT'
    }
  });
  
  // 4. Create category budgets
  if (data.categoryBudgets) {
    await prisma.categoryBudget.createMany({
      data: data.categoryBudgets.map(cb => ({
        planId: plan.id,
        categoryId: cb.categoryId,
        plannedAmount: cb.amount,
        priority: cb.priority,
        notes: cb.notes
      }))
    });
  }
  
  // 5. Create planned transactions
  if (data.plannedTransactions) {
    await prisma.plannedTransaction.createMany({
      data: data.plannedTransactions.map(pt => ({
        planId: plan.id,
        ...pt
      }))
    });
  }
  
  return plan;
}
```

### 4.2 Copy Plan from Previous Month
```typescript
async function copyPlanFromMonth(
  userId: string,
  sourceMonth: number,
  sourceYear: number,
  targetMonth: number,
  targetYear: number
) {
  // Get source plan
  const sourcePlan = await prisma.budgetPlan.findUnique({
    where: {
      userId_month_year: { userId, month: sourceMonth, year: sourceYear }
    },
    include: {
      categoryBudgets: true,
      plannedTransactions: true,
      milestones: true
    }
  });
  
  if (!sourcePlan) {
    throw new Error("Source plan not found");
  }
  
  // Create new plan with same structure
  const newPlan = await prisma.budgetPlan.create({
    data: {
      userId,
      month: targetMonth,
      year: targetYear,
      planName: `Copied from ${getMonthName(sourceMonth)} ${sourceYear}`,
      plannedIncome: sourcePlan.plannedIncome,
      plannedExpenses: sourcePlan.plannedExpenses,
      plannedSavings: sourcePlan.plannedSavings,
      status: 'DRAFT',
      copiedFromPlanId: sourcePlan.id,
      categoryBudgets: {
        create: sourcePlan.categoryBudgets.map(cb => ({
          categoryId: cb.categoryId,
          plannedAmount: cb.plannedAmount,
          priority: cb.priority,
          notes: cb.notes
        }))
      },
      // Don't copy specific transaction dates, just structure
      milestones: {
        create: sourcePlan.milestones.map(m => ({
          title: m.title,
          description: m.description,
          targetAmount: m.targetAmount,
          priority: m.priority
        }))
      }
    }
  });
  
  return newPlan;
}
```

### 4.3 Auto-Update Actuals (Background Job)
```typescript
// Run daily to update current month's plan with actual data
async function updatePlanActuals() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // Get all active/in-progress plans for current month
  const plans = await prisma.budgetPlan.findMany({
    where: {
      month: currentMonth,
      year: currentYear,
      status: { in: ['ACTIVE', 'IN_PROGRESS'] }
    },
    include: {
      categoryBudgets: true,
      plannedTransactions: true
    }
  });
  
  for (const plan of plans) {
    // Get actual transactions for this month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: plan.userId,
        date: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lte: endOfMonth(new Date(currentYear, currentMonth - 1))
        }
      },
      include: { category: true }
    });
    
    // Calculate actuals
    const actualIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const actualExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const actualSavings = actualIncome - actualExpenses;
    
    // Update plan
    await prisma.budgetPlan.update({
      where: { id: plan.id },
      data: {
        actualIncome,
        actualExpenses,
        actualSavings,
        variance: actualSavings - plan.plannedSavings,
        status: 'IN_PROGRESS'
      }
    });
    
    // Update category budgets
    for (const categoryBudget of plan.categoryBudgets) {
      const categoryTransactions = transactions.filter(
        t => t.categoryId === categoryBudget.categoryId
      );
      
      const actualAmount = categoryTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );
      
      const percentUsed = (actualAmount / categoryBudget.plannedAmount) * 100;
      
      await prisma.categoryBudget.update({
        where: { id: categoryBudget.id },
        data: {
          actualAmount,
          percentUsed,
          isOverBudget: actualAmount > categoryBudget.plannedAmount
        }
      });
    }
    
    // Match planned transactions with actuals
    for (const plannedTx of plan.plannedTransactions) {
      if (plannedTx.isCompleted) continue;
      
      // Try to find matching transaction
      const match = transactions.find(t =>
        Math.abs(t.amount - plannedTx.amount) < 10 && // Within ₹10
        t.type === plannedTx.type &&
        isSameDay(t.date, plannedTx.expectedDate)
      );
      
      if (match) {
        await prisma.plannedTransaction.update({
          where: { id: plannedTx.id },
          data: {
            isCompleted: true,
            actualTransactionId: match.id,
            actualAmount: match.amount,
            actualDate: match.date,
            variance: match.amount - plannedTx.amount
          }
        });
      }
    }
  }
  
  // Mark completed plans (month ended)
  if (isLastDayOfMonth(now)) {
    await prisma.budgetPlan.updateMany({
      where: {
        month: currentMonth,
        year: currentYear,
        status: 'IN_PROGRESS'
      },
      data: {
        status: 'COMPLETED'
      }
    });
  }
}
```

### 4.4 Smart Suggestions
```typescript
async function getSuggestedBudget(userId: string, month: number, year: number) {
  // Get past 3-6 months of data
  const pastMonths = 6;
  const transactions = await getTransactionsForPastMonths(userId, pastMonths);
  
  // Calculate averages per category
  const categoryAverages = {};
  const categories = await prisma.category.findMany({
    where: { userId }
  });
  
  for (const category of categories) {
    const categoryTxs = transactions.filter(t => t.categoryId === category.id);
    const total = categoryTxs.reduce((sum, t) => sum + t.amount, 0);
    categoryAverages[category.id] = total / pastMonths;
  }
  
  // Calculate income average
  const incomeAvg = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0) / pastMonths;
  
  // Calculate expense average
  const expenseAvg = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0) / pastMonths;
  
  // Suggest based on averages + 10% buffer
  return {
    suggestedIncome: Math.round(incomeAvg),
    suggestedExpenses: Math.round(expenseAvg * 1.1),
    suggestedSavings: Math.round(incomeAvg - (expenseAvg * 1.1)),
    categoryBudgets: Object.entries(categoryAverages).map(([id, avg]) => ({
      categoryId: id,
      suggestedAmount: Math.round((avg as number) * 1.1)
    }))
  };
}
```

---

## 5. API Endpoints

### 5.1 GET `/api/planner`
- List all plans for user
- Query: `year`, `status`
- Return: Array of plans with summary

### 5.2 POST `/api/planner`
- Create new budget plan
- Body: Plan details
- Return: Created plan

### 5.3 GET `/api/planner/[month]/[year]`
- Get plan for specific month
- Include: category budgets, planned transactions
- Return: Full plan details

### 5.4 PUT `/api/planner/[month]/[year]`
- Update plan
- Body: Updated plan data
- Return: Updated plan

### 5.5 DELETE `/api/planner/[month]/[year]`
- Delete plan (only if DRAFT)
- Return: Success message

### 5.6 POST `/api/planner/[month]/[year]/copy`
- Copy plan to another month
- Body: Target month/year
- Return: New plan

### 5.7 POST `/api/planner/[month]/[year]/activate`
- Change status from DRAFT to ACTIVE
- Return: Updated plan

### 5.8 GET `/api/planner/[month]/[year]/comparison`
- Get planned vs actual comparison
- Only for current/past months
- Return: Detailed comparison data

### 5.9 GET `/api/planner/suggestions`
- Get AI/ML based budget suggestions
- Query: `month`, `year`
- Based on past data
- Return: Suggested budgets

### 5.10 GET `/api/planner/templates`
- List saved templates
- Return: User's templates + system templates

### 5.11 POST `/api/planner/templates`
- Save plan as template
- Body: Plan ID, template name
- Return: Created template

---

## 6. Integration Points

### 6.1 With Transactions
- Auto-update actuals when transactions created
- Link actual transactions to planned transactions
- Show variance alerts

### 6.2 With Categories
- Category budgets track spending
- Alert when over budget
- Show category-wise variance

### 6.3 With Goals
- Link monthly savings to goals
- Track goal progress within plan
- Show goal contributions

### 6.4 With Recurring Transactions
- Import recurring transactions as planned transactions
- Auto-include in expense planning
- Update when recurring transactions change

### 6.5 With Dashboard
- Show current month's plan progress
- "Plan vs Actual" widget
- Budget alerts

### 6.6 With Analytics
- Planning accuracy metrics
- Historical comparison
- Trend analysis

### 6.7 With Notifications
- Alert when over budget
- Remind about planned transactions
- Notify at start of planned month

---

## 7. Advanced Features

### 7.1 Multi-Scenario Planning
- Create multiple "what-if" scenarios
- Compare scenarios side-by-side
- Choose best scenario to activate

### 7.2 Collaborative Planning
- Share plan with family members
- Approve/reject changes
- Comments on budget items

### 7.3 Rolling Plans
- Auto-create plans for next month based on patterns
- Continuous planning mode

### 7.4 Financial Goals Integration
- Allocate plan savings to specific goals
- Track goal funding progress
- Suggest savings adjustments for goal timelines

### 7.5 AI-Powered Insights
- Predict future expenses using ML
- Anomaly detection (unusual spending patterns)
- Smart budget optimization

---

## 8. UI/UX Considerations

### Visual Design
- Calendar-style month selector
- Color-coded status badges:
  - Draft: Gray
  - Active: Blue
  - In Progress: Yellow
  - Completed: Green
- Progress bars for budget utilization
- Charts: Pie (budget breakdown), Line (trend), Bar (comparison)

### Responsive Design
- Mobile: Stack month cards
- Tablet: 2 columns
- Desktop: Timeline view

### Accessibility
- Keyboard navigation through months
- Screen reader support for comparisons
- High contrast mode

---

## 9. Implementation Phases

### Phase 1: Core Planning (Week 1-2)
1. Prisma models
2. Create/Edit plan pages
3. Basic plan listing
4. Category budget allocation

### Phase 2: Tracking & Comparison (Week 3-4)
1. Auto-update actuals background job
2. Planned vs Actual view
3. Variance calculations
4. Category tracking

### Phase 3: Smart Features (Week 5-6)
1. Copy from previous month
2. Templates system
3. Smart suggestions
4. Planned transaction matching

### Phase 4: Analytics & Polish (Week 7-8)
1. Planning accuracy analytics
2. Insights generation
3. Dashboard integration
4. Notifications
5. Export/reports

---

This detailed specification provides everything needed to build a comprehensive financial planner that helps users plan ahead and track their financial performance!
