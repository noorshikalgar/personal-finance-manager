'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronRight, CheckCircle2, Wallet, DollarSign, Folders, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Step definitions with icons and actions
const ALL_STEPS = {
  welcome: {
    id: 'welcome',
    title: '👋 Welcome!',
    description: 'Let\'s get you set up with Personal Finance Manager',
    icon: null,
    action: null,
    href: null,
  },
  add_account: {
    id: 'add_account',
    title: '🏦 Add Your First Account',
    description: 'Start tracking by adding a bank account or credit card',
    icon: Wallet,
    action: 'Add Account',
    href: '/dashboard/accounts/new',
  },
  add_category: {
    id: 'add_category',
    title: '📂 Create Categories',
    description: 'Organize transactions with categories like Food, Transport, etc.',
    icon: Folders,
    action: 'Add Category',
    href: '/dashboard/categories/new',
  },
  add_transaction: {
    id: 'add_transaction',
    title: '💰 Record Your First Transaction',
    description: 'Add an income or expense to start tracking your money',
    icon: DollarSign,
    action: 'Add Transaction',
    href: '/dashboard/transactions/new',
  },
  done: {
    id: 'done',
    title: '🎉 All Set!',
    description: 'You\'re ready to manage your finances like a pro!',
    icon: CheckCircle2,
    action: null,
    href: null,
  },
} as const

interface OnboardingWizardProps {
  userId: string
  accountCount?: number
  transactionCount?: number
  categoryCount?: number
  message?: string
  onComplete: () => void
  onHide?: () => void
}

export function OnboardingWizard({
  userId,
  accountCount = 0,
  transactionCount = 0,
  categoryCount = 0,
  message: initialMessage = '',
  onComplete,
  onHide,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [displayMessage, setDisplayMessage] = useState(initialMessage)
  const [isHidden, setIsHidden] = useState(false)

  const allSteps: (keyof typeof ALL_STEPS)[] = ['welcome', 'add_account', 'add_category', 'add_transaction', 'done']

  const getStepIndexFromProgress = () => {
    if (accountCount === 0) {
      return allSteps.indexOf('add_account')
    }
    if (categoryCount === 0) {
      return allSteps.indexOf('add_category')
    }
    if (transactionCount === 0) {
      return allSteps.indexOf('add_transaction')
    }
    return allSteps.indexOf('done')
  }

  // Determine which steps are completed
  const completedSteps = new Set<string>()
  if (currentStepIndex > 0) completedSteps.add('welcome')
  if (accountCount > 0) completedSteps.add('add_account')
  if (categoryCount > 0) completedSteps.add('add_category')
  if (transactionCount > 0) completedSteps.add('add_transaction')

  // Reset isHidden when user completes an action (accountCount/categoryCount changes)
  useEffect(() => {
    console.log('🔍 Counts changed:', { accountCount, categoryCount, transactionCount, isHidden })
    
    // Always show popup when user has completed an action and we're not on Done step
    const hasNewData = accountCount > 0 || categoryCount > 0 || transactionCount > 0
    const allComplete = accountCount > 0 && categoryCount > 0 && transactionCount > 0
    
    if (hasNewData && !allComplete) {
      console.log('✅ Detected incomplete data - showing popup for next step')
      setIsHidden(false)
    } else if (allComplete) {
      console.log('✅ All data complete - showing Done screen')
      setIsHidden(false)
    }
  }, [accountCount, categoryCount, transactionCount])

  const progressSnapshot = useRef<{ accountCount: number; categoryCount: number; transactionCount: number } | null>(null)

  // Auto-advance to next step only when the underlying progress changes
  useEffect(() => {
    const previous = progressSnapshot.current
    const hasChanged =
      !previous ||
      previous.accountCount !== accountCount ||
      previous.categoryCount !== categoryCount ||
      previous.transactionCount !== transactionCount

    if (!hasChanged) {
      return
    }

    progressSnapshot.current = { accountCount, categoryCount, transactionCount }

    const hasProgress = accountCount > 0 || categoryCount > 0 || transactionCount > 0
    const nextIndex = getStepIndexFromProgress()

    if (currentStepIndex === 0) {
      if (hasProgress && nextIndex !== -1) {
        setCurrentStepIndex(nextIndex)
      }
      return
    }

    if (nextIndex !== -1 && nextIndex !== currentStepIndex) {
      setCurrentStepIndex(nextIndex)
    }
  }, [accountCount, categoryCount, transactionCount, currentStepIndex])

  // Generate smart message based on current progress
  useEffect(() => {
    const currentStepId = allSteps[currentStepIndex]
    
    if (currentStepId === 'welcome') {
      const hasProgress = accountCount > 0 || categoryCount > 0 || transactionCount > 0
      if (hasProgress) {
        setDisplayMessage("Welcome back! Let's finish setting up your finance manager.")
      } else {
        setDisplayMessage("Let's get you started! Follow the steps to set up your finance manager.")
      }
    } else if (currentStepId === 'add_account') {
      setDisplayMessage('Add your bank account, credit card, or cash wallet to start tracking.')
    } else if (currentStepId === 'add_category') {
      setDisplayMessage(`Great! You have ${accountCount} account${accountCount > 1 ? 's' : ''}. Now let's create categories to organize your transactions.`)
    } else if (currentStepId === 'add_transaction') {
      setDisplayMessage("Perfect! Categories are set up. Now let's record your first transaction.")
    } else if (currentStepId === 'done') {
      setDisplayMessage("🎉 Awesome! You're all set up and ready to manage your finances!")
    }
  }, [currentStepIndex, accountCount, categoryCount, transactionCount])

  const step = ALL_STEPS[allSteps[currentStepIndex]]

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skipTour: true }),
      })

      if (response.ok) {
        toast.success('Tour skipped! You can start exploring.')
        onComplete()
      } else {
        throw new Error('Failed to skip')
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      toast.error('Failed to skip tour')
      setIsSkipping(false)
    }
  }

  const handleNext = async () => {
    // If at last step (done), complete onboarding
    if (currentStepIndex === allSteps.length - 1) {
      setIsLoading(true)
      try {
        const response = await fetch('/api/auth/complete-onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ complete: true }),
        })

        if (response.ok) {
          console.log('✅ Onboarding completed')
          toast.success('🎉 Welcome to Finance Manager!')
          setIsHidden(true)
          setTimeout(() => {
            router.push('/dashboard')
          }, 600)
        }
      } catch (error) {
        console.error('Failed to complete onboarding:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      // Move to next step
      const nextIndex = currentStepIndex + 1
      if (nextIndex < allSteps.length) {
        setCurrentStepIndex(nextIndex)
      }
    }
  }

  const handleAction = () => {
    if (step?.href) {
      // Hide popup immediately when user clicks action button
      setIsHidden(true)
      // Navigate to the action page
      router.push(step.href)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  // Calculate progress based on ALL steps
  const progress = ((currentStepIndex + 1) / allSteps.length) * 100
  const Icon = step?.icon

  if (!step) {
    return null
  }

  const isLastStep = currentStepIndex === allSteps.length - 1
  const isAllComplete = accountCount > 0 && transactionCount > 0 && categoryCount > 0

  // If manually hidden on client (waiting for completion), don't render
  if (isHidden) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Getting Started</h1>
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {allSteps.length}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-8">
            {/* Icon */}
            {Icon && (
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
              </div>
            )}

            {/* Title & Description */}
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-foreground">{step.title}</h2>
              <p className="text-lg text-muted-foreground">{step.description}</p>
            </div>

            {/* Smart message - shows progress or setup status (FIX 4) */}
            {displayMessage && (
              <div className={`rounded-lg px-4 py-3 text-center ${
                isAllComplete
                  ? 'bg-accent/10 border border-accent/20'
                  : 'bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800'
              }`}>
                <p className={`text-sm ${isAllComplete ? 'text-accent' : 'text-blue-700 dark:text-blue-300'}`}>
                  {displayMessage}
                </p>
              </div>
            )}

            {/* Steps checklist - show ALL steps, mark completed ones (WELCOME HIDDEN) */}
            {currentStepIndex < allSteps.length - 1 && (
              <div className="space-y-2 bg-background/50 p-6 rounded-lg">
                {allSteps.filter(s => s !== 'done').map((stepId, idx) => {
                  const s = ALL_STEPS[stepId]
                  const isCurrent = idx === currentStepIndex
                  const isPast = idx < currentStepIndex
                  const isCompleted = completedSteps.has(stepId)

                  return (
                    <div key={stepId} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-green-500'
                            : isCurrent
                            ? 'bg-primary'
                            : 'bg-muted border-2 border-border'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : (
                          <span
                            className={`text-xs font-medium ${
                              isCurrent ? 'text-white' : 'text-muted-foreground'
                            }`}
                          >
                            {stepId === 'welcome' ? '👋' : idx}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-sm transition-colors ${
                          isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : isCurrent
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSkipping || isLoading}
          >
            {isSkipping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Skipping...
              </>
            ) : (
              'Skip Tour'
            )}
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              Back
            </Button>

            {step?.action && step?.href && currentStepIndex > 0 && currentStepIndex < allSteps.length - 1 && (
              <Button
                variant="secondary"
                onClick={handleAction}
                disabled={isLoading || isSkipping}
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                {step.action}
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={isLoading || isSkipping}
            >
              {isLastStep ? (
                <>
                  Close <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
