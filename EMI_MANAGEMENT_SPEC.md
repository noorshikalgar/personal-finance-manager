# EMI Management Feature - Detailed Specification

## Overview
A comprehensive EMI (Equated Monthly Installment) / Loan Management system that helps users track all their loans, calculate interest, monitor payments, and manage repayments effectively.

---

## 1. Data Model (Prisma Schema)

### EMI Model
```prisma
model EMI {
  id                String        @id @default(cuid())
  userId            String
  user              User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Basic Information
  loanName          String        // e.g., "Home Loan", "Car Loan", "Personal Loan"
  loanType          LoanType      // HOME, CAR, PERSONAL, EDUCATION, BUSINESS, CREDIT_CARD, OTHER
  lender            String        // Bank/Institution name
  
  // Financial Details
  principalAmount   Float         // Original loan amount
  interestRate      Float         // Annual interest rate (percentage)
  tenureMonths      Int           // Total loan tenure in months
  emiAmount         Float         // Monthly EMI amount
  
  // Dates
  startDate         DateTime      // Loan start date
  endDate           DateTime      // Expected completion date
  
  // Tracking
  currentBalance    Float         // Remaining principal
  totalPaid         Float         @default(0) // Total amount paid so far
  principalPaid     Float         @default(0) // Principal portion paid
  interestPaid      Float         @default(0) // Interest portion paid
  
  // Optional Features
  prepayments       Float         @default(0) // Total prepayments made
  lateFees          Float         @default(0) // Late payment charges
  processingFee     Float         @default(0) // One-time processing fee
  
  // Category & Status
  categoryId        String?
  category          Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  status            EMIStatus     @default(ACTIVE) // ACTIVE, COMPLETED, CLOSED_EARLY
  
  // Auto-payment
  autoDeduct        Boolean       @default(false) // Auto-create transaction on EMI date
  emiDate           Int           // Day of month (1-31) when EMI is due
  accountId         String?       // Account from which EMI is deducted
  account           Account?      @relation(fields: [accountId], references: [id], onDelete: SetNull)
  
  // Relations
  payments          EMIPayment[]  // Track individual EMI payments
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([userId])
  @@index([status])
}

enum LoanType {
  HOME
  CAR
  PERSONAL
  EDUCATION
  BUSINESS
  CREDIT_CARD
  OTHER
}

enum EMIStatus {
  ACTIVE        // Currently paying
  COMPLETED     // Fully paid off
  CLOSED_EARLY  // Closed with prepayment
}

model EMIPayment {
  id              String    @id @default(cuid())
  emiId           String
  emi             EMI       @relation(fields: [emiId], references: [id], onDelete: Cascade)
  
  // Payment Details
  paymentDate     DateTime
  emiNumber       Int       // Which EMI installment (1, 2, 3...)
  amountPaid      Float     // Actual amount paid
  principalPart   Float     // Principal portion
  interestPart    Float     // Interest portion
  
  // Additional charges/adjustments
  lateFee         Float     @default(0)
  prepayment      Float     @default(0) // Extra amount paid
  
  // Link to transaction
  transactionId   String?   @unique
  transaction     Transaction? @relation(fields: [transactionId], references: [id], onDelete: SetNull)
  
  // Remaining after this payment
  remainingBalance Float
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([emiId])
  @@index([paymentDate])
}
```

---

## 2. User Interface Components

### 2.1 EMI Dashboard (`/dashboard/emi`)
**Overview Cards:**
- Total Active EMIs (count)
- Total Outstanding Balance
- Total Monthly EMI Burden
- Total Interest Paid (all time)
- Total Interest Saved (from prepayments)

**EMI List View:**
- Card-based layout similar to recurring transactions
- Each card shows:
  - Loan name & type icon
  - Lender name
  - Monthly EMI amount
  - Progress bar (% paid)
  - Remaining balance
  - Next EMI date
  - Status badge (Active/Completed)
  - Quick actions: View Details, Pay EMI, Close Loan

**Filters:**
- Status: All / Active / Completed
- Loan Type: All / Home / Car / Personal / etc.
- Sort by: EMI Amount, Balance, End Date

**Add New EMI Button** (prominent)

---

### 2.2 Add/Edit EMI Page (`/dashboard/emi/new` & `/dashboard/emi/[id]/edit`)

**Step 1: Basic Information**
- Loan Name (text input)
- Loan Type (dropdown)
- Lender/Bank Name (text input)
- Category (CategorySelector component)

**Step 2: Loan Details**
- Principal Amount (number input with currency)
- Interest Rate (% per annum) (number input)
- Loan Tenure (number input in months or years with toggle)
- EMI Start Date (date picker)
- EMI Due Date (1-31 of each month)
- Processing Fee (optional)

**Step 3: Auto-Calculation**
- Show calculated EMI amount using formula:
  ```
  EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
  Where:
  P = Principal
  R = Monthly interest rate (Annual rate / 12 / 100)
  N = Tenure in months
  ```
- Display breakdown:
  - Monthly EMI: ₹X,XXX
  - Total Interest: ₹X,XXX
  - Total Payment: ₹X,XXX
  - Expected End Date: DD/MM/YYYY

**Step 4: Auto-Payment Setup (Optional)**
- Enable auto-deduct (toggle)
- Select account for auto-deduction
- Note: "A transaction will be auto-created on EMI date each month"

**Validation:**
- All required fields
- Interest rate: 0-50%
- Tenure: 1-360 months
- EMI date: 1-31

---

### 2.3 EMI Details Page (`/dashboard/emi/[id]`)

**Header Section:**
- Loan name
- Lender
- Status badge
- Edit button
- Close Loan button (for active EMIs)

**Summary Cards (4 columns):**
1. **Loan Overview**
   - Original Amount
   - Tenure
   - Interest Rate
   - EMI Amount

2. **Payment Progress**
   - Amount Paid
   - Principal Paid
   - Interest Paid
   - Prepayments Made

3. **Remaining**
   - Outstanding Balance
   - EMIs Remaining
   - Interest Remaining
   - Expected End Date

4. **Savings & Charges**
   - Interest Saved (from prepayments)
   - Late Fees Paid
   - Processing Fee

**Visual Progress:**
- Progress bar showing % completion
- Donut chart: Principal Paid vs Interest Paid vs Remaining

**Amortization Schedule Table:**
| EMI No. | Date | EMI Amount | Principal | Interest | Prepayment | Balance | Status |
|---------|------|------------|-----------|----------|------------|---------|--------|
| 1 | Jan 2025 | ₹10,000 | ₹6,000 | ₹4,000 | ₹0 | ₹94,000 | Paid ✓ |
| 2 | Feb 2025 | ₹10,000 | ₹6,200 | ₹3,800 | ₹5,000 | ₹82,800 | Paid ✓ |
| 3 | Mar 2025 | ₹10,000 | ₹6,400 | ₹3,600 | ₹0 | ₹76,400 | Due |
| ... | ... | ... | ... | ... | ... | ... | ... |

- Show past payments (marked as Paid)
- Show upcoming schedule (calculated, marked as Scheduled)
- Highlight current month EMI
- Filter: All / Paid / Upcoming

**Payment History:**
- List of all EMI payments made
- Each entry shows:
  - Payment date
  - Amount paid
  - Principal + Interest breakdown
  - Any prepayment
  - Late fees (if any)
  - Linked transaction (clickable)

**Action Buttons:**
1. **Pay EMI** - Record a payment
2. **Make Prepayment** - Record extra payment to reduce principal
3. **Edit Loan Details** - Navigate to edit page
4. **Close Loan** - Mark as completed (if fully paid)
5. **View Linked Transactions** - Show all related transactions

---

### 2.4 Pay EMI Modal/Page

**Payment Form:**
- Payment Date (date picker, default: today)
- Amount Paid (pre-filled with EMI amount, editable)
- Prepayment Amount (optional, separate field)
- Late Fee (optional)
- Payment Method:
  - Option 1: Create transaction automatically (select account)
  - Option 2: Payment already made (just record in EMI tracker)
- Notes (optional)

**Auto-Calculation:**
- Calculate principal and interest breakdown based on:
  - Current balance
  - Interest rate
  - Remaining tenure
  - Show breakdown: Principal: ₹X, Interest: ₹Y

**Prepayment Impact:**
- If prepayment entered, show:
  - New remaining balance
  - Reduced tenure (if applicable)
  - Interest saved
  - New expected end date

**Submit Actions:**
1. Create EMIPayment record
2. Update EMI tracking fields (currentBalance, principalPaid, etc.)
3. Optionally create Transaction
4. Recalculate amortization schedule if prepayment made
5. Check if loan completed (balance = 0)

---

### 2.5 Close Loan Modal

**Closure Options:**
1. **Fully Paid** (Completed)
   - Enter final payment details
   - Calculate closure amount
   - Mark status as COMPLETED

2. **Closed Early** (Prepayment closure)
   - Enter prepayment amount
   - Calculate interest saved
   - Any foreclosure charges
   - Mark status as CLOSED_EARLY

**Show Summary:**
- Total paid
- Total interest paid
- Interest saved (if early closure)
- Tenure completed

---

## 3. Business Logic & Calculations

### 3.1 EMI Calculation
```typescript
function calculateEMI(principal: number, annualRate: number, months: number): number {
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi * 100) / 100;
}
```

### 3.2 Generate Amortization Schedule
```typescript
function generateAmortizationSchedule(
  principal: number,
  monthlyEMI: number,
  annualRate: number,
  months: number,
  startDate: Date,
  payments: EMIPayment[]
): AmortizationEntry[] {
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;
  const schedule = [];
  
  for (let i = 1; i <= months; i++) {
    const interestPart = balance * monthlyRate;
    const principalPart = monthlyEMI - interestPart;
    
    // Check if payment was made
    const payment = payments.find(p => p.emiNumber === i);
    
    if (payment) {
      balance = payment.remainingBalance;
    } else {
      balance -= principalPart;
    }
    
    schedule.push({
      emiNumber: i,
      date: addMonths(startDate, i - 1),
      emiAmount: monthlyEMI,
      principalPart,
      interestPart,
      balance: Math.max(0, balance),
      isPaid: !!payment,
      payment: payment || null
    });
    
    if (balance <= 0) break;
  }
  
  return schedule;
}
```

### 3.3 Calculate Prepayment Impact
```typescript
function calculatePrepaymentImpact(
  currentBalance: number,
  monthlyEMI: number,
  annualRate: number,
  remainingMonths: number,
  prepaymentAmount: number
): PrepaymentImpact {
  // New balance after prepayment
  const newBalance = currentBalance - prepaymentAmount;
  
  // Calculate new tenure with same EMI
  const monthlyRate = annualRate / 12 / 100;
  const newMonths = Math.ceil(
    Math.log(monthlyEMI / (monthlyEMI - newBalance * monthlyRate)) / 
    Math.log(1 + monthlyRate)
  );
  
  // Calculate interest saved
  const oldTotalPayment = monthlyEMI * remainingMonths;
  const newTotalPayment = monthlyEMI * newMonths + prepaymentAmount;
  const interestSaved = oldTotalPayment - newTotalPayment;
  
  return {
    newBalance,
    monthsSaved: remainingMonths - newMonths,
    interestSaved,
    newEndDate: addMonths(new Date(), newMonths)
  };
}
```

### 3.4 Auto-Payment Cron Job
```typescript
// Run daily at 00:05 AM
export async function processEMIAutoPayments() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  
  // Find all active EMIs with auto-deduct enabled for today
  const emisDueToday = await prisma.emi.findMany({
    where: {
      status: 'ACTIVE',
      autoDeduct: true,
      emiDate: dayOfMonth,
      currentBalance: { gt: 0 }
    },
    include: { account: true, user: true }
  });
  
  for (const emi of emisDueToday) {
    // Check if payment already made this month
    const existingPayment = await prisma.emiPayment.findFirst({
      where: {
        emiId: emi.id,
        paymentDate: {
          gte: startOfMonth(today),
          lte: endOfMonth(today)
        }
      }
    });
    
    if (existingPayment) continue; // Already paid
    
    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: emi.userId,
        accountId: emi.accountId,
        categoryId: emi.categoryId,
        type: 'EXPENSE',
        amount: emi.emiAmount,
        description: `EMI Payment - ${emi.loanName}`,
        date: today,
        tags: ['EMI', 'Auto-Payment']
      }
    });
    
    // Calculate principal and interest breakdown
    const monthlyRate = emi.interestRate / 12 / 100;
    const interestPart = emi.currentBalance * monthlyRate;
    const principalPart = emi.emiAmount - interestPart;
    
    // Record EMI payment
    const paymentsCount = await prisma.emiPayment.count({
      where: { emiId: emi.id }
    });
    
    await prisma.emiPayment.create({
      data: {
        emiId: emi.id,
        paymentDate: today,
        emiNumber: paymentsCount + 1,
        amountPaid: emi.emiAmount,
        principalPart,
        interestPart,
        transactionId: transaction.id,
        remainingBalance: emi.currentBalance - principalPart
      }
    });
    
    // Update EMI tracking
    await prisma.emi.update({
      where: { id: emi.id },
      data: {
        currentBalance: emi.currentBalance - principalPart,
        totalPaid: emi.totalPaid + emi.emiAmount,
        principalPaid: emi.principalPaid + principalPart,
        interestPaid: emi.interestPaid + interestPart,
        status: emi.currentBalance - principalPart <= 0 ? 'COMPLETED' : 'ACTIVE'
      }
    });
    
    // Send notification
    await createNotification({
      userId: emi.userId,
      type: 'EMI_PAYMENT',
      title: 'EMI Payment Processed',
      message: `₹${emi.emiAmount} paid for ${emi.loanName}`,
      relatedId: emi.id
    });
  }
}
```

---

## 4. API Endpoints

### 4.1 GET `/api/emi`
- List all EMIs for user
- Query params: `status`, `type`
- Return: Array of EMI objects with summary stats

### 4.2 POST `/api/emi`
- Create new EMI
- Body: Loan details
- Auto-calculate: EMI amount, end date, total interest
- Return: Created EMI object

### 4.3 GET `/api/emi/[id]`
- Get single EMI details
- Include: payments, amortization schedule
- Return: EMI object with full details

### 4.4 PUT `/api/emi/[id]`
- Update EMI details
- Note: Recalculate schedule if principal/rate/tenure changed
- Return: Updated EMI object

### 4.5 DELETE `/api/emi/[id]`
- Delete EMI (soft delete or hard delete based on payments)
- Return: Success message

### 4.6 POST `/api/emi/[id]/payment`
- Record an EMI payment
- Body: Payment details, prepayment, late fee
- Auto-update: EMI tracking fields
- Optionally create transaction
- Return: Created payment object

### 4.7 POST `/api/emi/[id]/close`
- Close loan (fully paid or early closure)
- Body: Closure details
- Update status to COMPLETED or CLOSED_EARLY
- Return: Closure summary

### 4.8 GET `/api/emi/[id]/schedule`
- Get amortization schedule
- Query params: `paid`, `upcoming`
- Return: Array of schedule entries

### 4.9 GET `/api/emi/summary`
- Get user's EMI summary/stats
- Return: Total EMIs, total burden, total interest paid, etc.

---

## 5. Integration Points

### 5.1 With Categories
- Link EMI to expense category (e.g., "Home Loan", "Car Loan")
- EMI payments auto-update category spending
- Show EMI impact on budget

### 5.2 With Accounts
- Select account from which EMI is deducted
- Auto-create expense transaction on payment
- Update account balance

### 5.3 With Transactions
- Each EMI payment creates/links to a transaction
- View transaction from EMI payment history
- View EMI details from transaction page

### 5.4 With Notifications
- Notify 3 days before EMI due date
- Notify on successful auto-payment
- Notify on loan completion
- Alert on missed payment

### 5.5 With Dashboard
- Show "EMI Due Soon" widget
- Show total monthly EMI burden
- Include EMI expenses in expense charts

### 5.6 With Analytics
- EMI vs Income ratio
- Interest paid trend chart
- Debt-free projection timeline
- Loan burden analysis

---

## 6. Additional Features

### 6.1 EMI Calculator (Standalone Tool)
- Calculate EMI without creating a loan
- Compare different scenarios (rates, tenures)
- Available at `/dashboard/emi/calculator`

### 6.2 Comparison Tool
- Compare multiple loans side by side
- Show which is better deal
- Interest saved by shorter tenure

### 6.3 Refinancing Simulator
- Check if refinancing is beneficial
- Input new rate and see savings

### 6.4 Debt Snowball/Avalanche Strategy
- Suggest which loan to pay off first
- Optimize prepayment strategy

### 6.5 Export & Reports
- Download EMI schedule as PDF/Excel
- Tax certificate for home loan interest
- Year-end summary

---

## 7. UI/UX Considerations

### Colors & Icons
- Loan Type Icons: 🏠 Home, 🚗 Car, 🎓 Education, 💼 Business
- Status Colors:
  - Active: Blue
  - Completed: Green
  - Overdue: Red
- Progress bars with gradient

### Responsive Design
- Mobile: Stack cards vertically
- Tablet: 2 columns
- Desktop: 3-4 columns for EMI grid

### Accessibility
- Screen reader support for all calculations
- Keyboard navigation
- High contrast mode

### Performance
- Pagination for large payment histories
- Lazy load amortization schedule
- Cache calculated schedules

---

## 8. Migration & Implementation Plan

### Phase 1: Basic EMI Tracking
1. Create Prisma models
2. Build Add EMI form with calculations
3. List EMI page
4. Details page with basic info

### Phase 2: Payment Recording
1. Pay EMI functionality
2. Payment history
3. Update tracking fields
4. Link to transactions

### Phase 3: Advanced Features
1. Amortization schedule
2. Prepayment handling
3. Charts and visualizations
4. Auto-payment cron job

### Phase 4: Polish & Integration
1. EMI calculator tool
2. Dashboard widgets
3. Notifications
4. Analytics integration
5. Export/reports

---

## 9. Testing Scenarios

1. **Create EMI**: Different loan types, amounts, tenures
2. **EMI Calculation**: Verify formula accuracy
3. **Payment Recording**: Regular, prepayment, late fee
4. **Balance Updates**: Ensure accurate tracking
5. **Auto-Payment**: Cron job execution
6. **Loan Closure**: Full payment, early closure
7. **Schedule Generation**: Verify amortization math
8. **Edge Cases**: 
   - Very high interest rates
   - Very long/short tenures
   - Multiple prepayments
   - Missed payments

---

This specification provides a complete roadmap for implementing EMI management. Next, I'll create the Financial Planner specification!
