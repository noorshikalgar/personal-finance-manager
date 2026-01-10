# Onboarding Flow - All Scenarios

## Current State Analysis
- `hasAccounts`: boolean
- `hasTransactions`: boolean  
- `hasCategories`: boolean
- `onboardingSkipped`: boolean
- `onboardingCompleted`: boolean

---

## Scenario 1: BRAND NEW USER
**State:** No accounts, No transactions, No categories, NOT skipped

**Expected Flow:**
- Show: Welcome → Add Account → Add Transaction → Add Category → Done
- Steps shown: ALL 5 steps (none skipped)
- Message: "Let's get you set up! First, add your first account"
- On account creation: "✅ Great! Account added. Now let's record your first transaction"
- On transaction creation: "✅ Awesome! Transaction added. Now let's organize with categories"
- On category creation: "✅ Perfect! Categories set up. You're all done!"
- Progress bar: 0% → 20% → 40% → 60% → 100%

**Status:** ❌ NOT FIXED - Shows completed step as crossed out instead of skipping

---

## Scenario 2: ACCOUNT ALREADY EXISTS
**State:** Has accounts (1+), No transactions, No categories, NOT skipped

**Expected Flow:**
- Skip: Add Account step COMPLETELY
- Show: Welcome → [SKIP Add Account] → Add Transaction → Add Category → Done
- Steps shown: 4 steps (Account step hidden)
- Message: "✅ Account ready! Now let's add your first transaction"
- On transaction creation: "✅ Great! Now add categories to organize"
- On category creation: "✅ All set! You're ready to go!"
- Progress bar: 0% → 33% → 66% → 100%

**Status:** ❌ NOT FIXED - Showing crossed out account step

---

## Scenario 3: ACCOUNT + CATEGORY EXIST
**State:** Has accounts (1+), No transactions, Has categories (1+), NOT skipped

**Expected Flow:**
- Skip: Add Account AND Add Category steps COMPLETELY
- Show: Welcome → [SKIP Add Account] → Add Transaction → [SKIP Add Category] → Done
- Steps shown: 3 steps
- Combined message: "✅ Account and categories ready! Now let's add your first transaction to track"
- On transaction creation: "✅ Perfect! You're all set. Transactions will flow through your categories!"
- Progress bar: 0% → 50% → 100%

**Status:** ❌ NOT FIXED - Need combined message

---

## Scenario 4: ALL THREE EXIST
**State:** Has accounts (1+), Has transactions (1+), Has categories (1+), NOT skipped

**Expected Flow:**
- Skip: ALL action steps
- Show: Welcome → [Combined Success Screen] → Done
- Message: "🎉 Everything's set up! You have accounts, transactions, and categories. You're ready to manage your finances!"
- Single button: "Let's Go!"
- Progress bar: 100%
- No step-by-step walkthrough, just congratulations

**Status:** ❌ NOT FIXED - Should skip wizard entirely or show instant completion

---

## Scenario 5: USER ALREADY SKIPPED
**State:** onboardingSkipped = true

**Expected Flow:**
- Don't show wizard AT ALL
- User goes directly to dashboard
- No interruption

**Status:** ✅ WORKING

---

## Scenario 6: NEW USER CLICKS SKIP
**State:** Any state, user clicks "Skip Tour" button

**Expected Flow:**
- Set: onboardingSkipped = true
- Set: onboardingCompleted = true
- Show toast: "Tour skipped! You can always restart from settings"
- Close wizard immediately
- User goes to dashboard

**Status:** ✅ WORKING

---

## Scenario 7: USER GOES TO ACCOUNT CREATION
**State:** No accounts yet, viewing "Add Account" step

**Expected Flow:**
- User clicks "Add Account" button
- Navigate to `/dashboard/accounts/new`
- User fills form and creates account
- API call to track: `{ action: 'add_account' }`
- Dashboard reloads
- Wizard re-renders with NEW state (hasAccounts = true)
- Wizard auto-advances to next uncompleted step (Add Transaction)
- Toast message: "✅ Great! Account added. Now let's record your first transaction"
- Progress bar updates

**Status:** ❌ NOT FIXED - Next button doesn't work, wizard doesn't re-appear

---

## Scenario 8: PROGRESS BAR CALCULATION
**Formula:** (currentStepIndex + 1) / totalVisibleSteps * 100

- Scenario 1 (5 steps): Step 1 = 20%, Step 2 = 40%, Step 3 = 60%, Step 4 = 80%, Step 5 = 100%
- Scenario 2 (4 steps): Step 1 = 25%, Step 2 = 50%, Step 3 = 75%, Step 4 = 100%
- Scenario 3 (3 steps): Step 1 = 33%, Step 2 = 66%, Step 3 = 100%
- Scenario 4 (2 steps): Step 1 = 50%, Step 2 = 100%

**Status:** ❌ NOT FIXED - Progress calculation wrong

---

## Scenario 9: NEXT BUTTON FLOW
**Logic:**
- If at last visible step: Show "Complete" button (not "Next")
- If NOT at last visible step: Show "Next" button
- Click "Next": Move to next visible step in dynamicSteps array
- Click "Complete": Mark onboarding as complete and close wizard

**Status:** ❌ NOT FIXED - Next button doesn't advance properly

---

## Scenario 10: BACK BUTTON FLOW
**Logic:**
- Only show if NOT at first step
- Click: Go to previous visible step
- Don't allow going before Welcome

**Status:** ✅ WORKING (but untested)

---

## API Endpoint Behavior

### Case: Check Progress (Dashboard Load)
```
POST /api/auth/complete-onboarding
{ syncStatus: true }

Response:
{
  hasAccounts: boolean
  hasTransactions: boolean
  hasCategories: boolean
  accountCount: number
  transactionCount: number
  categoryCount: number
  nextStep: number (0-5)
  neededSteps: string[] (only uncompleted steps)
  completedSteps: string[] (already done)
  message: string (smart contextual message)
}
```

### Case: Track Action
```
POST /api/auth/complete-onboarding
{ action: 'add_account' | 'add_transaction' | 'add_category' }

Response:
{
  message: string (contextual message for this action)
  currentStep: number (next step to show)
  completed: boolean (is entire onboarding done)
  nextAction: string | null (what to show next)
}
```

---

## Fix Checklist

- [ ] **Fix 1:** API returns complete status on every call
- [ ] **Fix 2:** Wizard receives full status (hasAccounts, hasTransactions, hasCategories)
- [ ] **Fix 3:** Wizard filters steps - only shows uncompleted steps
- [ ] **Fix 4:** Wizard builds dynamic messages based on state
- [ ] **Fix 5:** Wizard calculates progress correctly (based on visible steps)
- [ ] **Fix 6:** Next button advances through ONLY visible steps
- [ ] **Fix 7:** Complete button marks as done and closes wizard
- [ ] **Fix 8:** Action tracking returns smart message
- [ ] **Fix 9:** Dashboard passes full status to wizard
- [ ] **Fix 10:** All 10 scenarios tested and working

---

## Testing Script (Pseudo-code)

```javascript
// Scenario 1: Fresh user
await createUser()
visitDashboard()
// Expect: 5 steps shown, no crossed-out items

// Scenario 2: With account
await createUser()
await createAccount()
refreshPage()
visitDashboard()
// Expect: 4 steps, account step HIDDEN not crossed

// Scenario 3: With account + category
await createUser()
await createAccount()
await createCategory()
refreshPage()
visitDashboard()
// Expect: Message says "Account and categories ready!"

// Scenario 4: Everything complete
await createUser()
await createAccount()
await addTransaction()
await createCategory()
refreshPage()
visitDashboard()
// Expect: "You're all set!" message, wizard auto-closes

// Scenario 5: Skip tour
clickSkip()
// Expect: Wizard closes, doesn't appear again
```

