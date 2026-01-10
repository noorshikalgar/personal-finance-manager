import { prisma } from '@/lib/prisma'

export interface UserOnboardingStatus {
  hasAccounts: boolean
  hasTransactions: boolean
  hasCategories: boolean
  accountCount: number
  transactionCount: number
  categoryCount: number
  neededSteps: string[] // Steps user still needs to complete
  completedSteps: string[] // Steps already done
  nextStep: number // Which step to show next
  message: string // Smart message for the wizard
}

/**
 * Analyze user's current setup and determine which onboarding steps they need
 */
export async function analyzeUserOnboardingStatus(
  userId: string
): Promise<UserOnboardingStatus> {
  const [user, accounts, transactions, categories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.account.findMany({
      where: { userId },
    }),
    prisma.transaction.findMany({
      where: { userId },
    }),
    prisma.category.findMany({
      where: { userId },
    }),
  ])

  if (!user) {
    throw new Error('User not found')
  }

  const hasAccounts = accounts.length > 0
  const hasTransactions = transactions.length > 0
  const hasCategories = categories.length > 0

  // Completed actions based on what they have in documented order
  const completedSteps: string[] = []
  const neededSteps: string[] = []

  if (hasAccounts) {
    completedSteps.push('add_account')
  } else {
    neededSteps.push('add_account')
  }

  if (hasAccounts && !hasCategories) {
    neededSteps.push('add_category')
  } else if (hasCategories) {
    completedSteps.push('add_category')
  }

  const canTrackTransactions = hasAccounts && hasCategories
  if (canTrackTransactions && !hasTransactions) {
    neededSteps.push('add_transaction')
  } else if (hasTransactions) {
    completedSteps.push('add_transaction')
  }

  const nextStep = !hasAccounts
    ? 1 // Add account
    : !hasCategories
    ? 2 // Add category
    : !hasTransactions
    ? 3 // Add transaction
    : 4 // Done

  // Generate smart message aligned to onboarding order
  let message = ''
  if (!hasAccounts) {
    message = '🏦 Let\'s start by adding your first account!'
  } else if (!hasCategories) {
    message = `📂 Great! You have ${accounts.length} account${accounts.length > 1 ? 's' : ''}. Now let\'s create categories to keep everything organized.`
  } else if (!hasTransactions) {
    message = '💰 Perfect! Categories are ready. Let\'s record your first transaction.'
  } else {
    message = '🎉 Awesome! You have everything set up.'
  }

  return {
    hasAccounts,
    hasTransactions,
    hasCategories,
    accountCount: accounts.length,
    transactionCount: transactions.length,
    categoryCount: categories.length,
    neededSteps,
    completedSteps,
    nextStep,
    message,
  }
}

/**
 * Sync onboarding progress with user's actual data
 * Call this periodically to ensure DB matches reality
 */
export async function syncOnboardingProgress(userId: string) {
  const status = await analyzeUserOnboardingStatus(userId)

  // Get current user state
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingCompleted: true, onboardingSkipped: true },
  })

  // If user already completed or skipped onboarding, don't overwrite it
  if (currentUser?.onboardingCompleted || currentUser?.onboardingSkipped) {
    return status
  }

  const allowedSteps = ['add_account', 'add_category', 'add_transaction']
  const updatedActions = [...new Set(status.completedSteps)].filter((step) =>
    allowedSteps.includes(step)
  )

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingCurrentStep: status.nextStep,
      onboardingCompletedActions: updatedActions,
    },
  })

  return status
}
