# 🧪 Onboarding Flow Testing Guide

## What Was Fixed

The onboarding wizard now implements a **smart progressive flow** that:

1. **Auto-advances** to the next step when an action is completed
2. **Syncs immediately** when user returns from adding account/transaction/category
3. **Generates contextual messages** based on current progress
4. **Skips completed steps** from the wizard (not shown as crossed-out)
5. **Detects completion** and shows "All Set!" screen

## Test Scenarios

### ✅ Scenario 1: Fresh User → Add Account → Add Transaction → Add Category

**Expected Flow:**
1. Open `/dashboard` → Wizard shows **5 steps**:
   - Welcome (current)
   - Add Account
   - Add Transaction
   - Add Category
   - Done
   - Progress: 0%
   - Message: "Let's get you started! First, let's add an account..."

2. Click "Add Account" button → Navigates to Add Account page

3. Fill form and submit → Success toast
   - Wizard should **NOT appear** (you're on different page)
   - Page shows "Account created!"

4. Browser auto-redirects to `/dashboard?wizard=continue` → Wizard re-appears
   - **Progress has synced** - now shows **4 steps**:
     - ~~Welcome~~ (struck through, but still visible)
     - Add Transaction (current, highlighted)
     - Add Category
     - Done
   - Progress: 25%
   - Message: "Great! You have 1 account. Now let's record your first transaction."

5. Click "Add Transaction" button → Navigates to Add Transaction page

6. Fill form and submit → Success toast
   - Auto-redirects to `/dashboard?wizard=continue`
   - Wizard re-appears and **auto-advances**:
     - Steps now: ~~Welcome~~, ~~Add Transaction~~, Add Category (current), Done
     - Progress: 50%
     - Message: "You've recorded transactions. Let's create categories to organize your spending!"

7. Click "Add Category" button → Navigates to Categories page

8. Add category and submit → Success toast
   - Auto-redirects to `/dashboard?wizard=continue`
   - Wizard **detects completion** and shows:
     - All steps struck through
     - Only "Done" step showing
     - Progress: 100%
     - Message: "🎉 Perfect! You're all set up and ready to manage your finances!"

9. Click "Complete" button → Wizard closes
   - Wizard won't appear again (onboarding marked complete)

---

### ✅ Scenario 2: User With Account → Skip Account Step

**Setup:** Create account first, then fresh session

**Expected Flow:**
1. Open `/dashboard` → Wizard shows **4 steps** (skips Add Account):
   - Welcome
   - Add Transaction (not "Add Account")
   - Add Category
   - Done
   - Message: "Great! You have 1 account. Now let's record your first transaction."

---

### ✅ Scenario 3: User With Account + Transaction → Only Add Category

**Setup:** Create account + add transaction, then fresh session

**Expected Flow:**
1. Open `/dashboard` → Wizard shows **3 steps**:
   - Welcome
   - Add Category (current)
   - Done
   - Message: "You've recorded transactions. Let's create categories to organize your spending!"

---

### ✅ Scenario 4: Everything Already Set Up → Instant Completion

**Setup:** Account + transaction + category exist

**Expected Flow:**
1. Open `/dashboard` → Wizard shows **completion screen**:
   - Only "Done" step shown
   - Message: "🎉 Perfect! You're all set..."
   - One button: "Complete"

---

## Key Differences from Before

| Aspect | Before ❌ | After ✅ |
|--------|----------|---------|
| **Step visibility** | All steps shown, completed ones crossed out | Only needed steps shown |
| **Progress bar** | Based on 6 total steps | Based on visible steps only |
| **Auto-advance** | No - user had to manually refresh | Yes - auto-advances on data sync |
| **Redirect behavior** | Redirected away from wizard page | Redirects back to dashboard with sync |
| **Messages** | Static | Dynamic based on current state |
| **Modal persistence** | Modal disappeared when navigating | Modal reappears after action |
| **Experience** | "TDS" (tedious/annoying) | Smart, guided flow |

---

## Technical Details of Fix

### 1. **Redirect Changes**
- Account/Transaction/Category pages now redirect to `/dashboard?wizard=continue` instead of their detail page
- Query param signals dashboard to force sync

### 2. **Auto-Advance Logic**
```typescript
// In OnboardingWizard.tsx
- If user is on "welcome" but accountCount > 0 → auto-advance
- If user is on "add_account" but transactionCount > 0 → auto-advance
- If user is on "add_transaction" but categoryCount > 0 → auto-advance
```

### 3. **Smart Message Generation**
```typescript
// Updates message based on:
- Current step ID (welcome, add_account, add_transaction, add_category, done)
- Actual counts from API (accountCount, transactionCount, categoryCount)
- Shows contextual guidance at each stage
```

### 4. **Step Filtering**
```typescript
// Build visibleSteps array upfront:
- Always include: welcome, done
- Include add_account only if accountCount === 0
- Include add_transaction only if accountCount > 0 && transactionCount === 0
- Include add_category only if accountCount > 0 && categoryCount === 0
```

---

## How to Test

1. **Make fresh account** with no data
2. **Open `/dashboard`** in browser
3. **Click "Add Account"** → fill form → submit
   - Browser should redirect back to dashboard
   - Wizard should show step 2 as current
   - Message should update automatically
4. **Repeat for Transaction and Category**
5. **Verify progress bar** advances correctly at each step
6. **Verify only 4 steps** shown when account exists (not 5)

---

## Files Changed

- `src/components/onboarding/OnboardingWizard.tsx` - Added auto-advance logic, smart messages, visible steps filtering
- `src/components/onboarding/OnboardingCheck.tsx` - Updated props to pass counts instead of step state
- `src/app/dashboard/page.tsx` - Always sync progress, pass counts to wizard
- `src/app/dashboard/accounts/new/page.tsx` - Redirect to `/dashboard?wizard=continue`
- `src/app/dashboard/transactions/new/page.tsx` - Redirect to `/dashboard?wizard=continue`
- `src/app/dashboard/categories/page.tsx` - Redirect to `/dashboard?wizard=continue` on success

---

## Success Criteria ✅

- [ ] Wizard shows only needed steps (no crossed-out completed steps)
- [ ] Steps auto-advance when action completes
- [ ] Progress bar calculates from visible steps only
- [ ] Messages update contextually at each step
- [ ] User is redirected back to dashboard after adding account/transaction/category
- [ ] Wizard reappears and is synced after redirect
- [ ] "Done" screen appears when all 3 items are complete
- [ ] Build passes (33/33 pages)
- [ ] No console errors
