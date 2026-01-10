'use client'

import { useEffect, useState } from 'react'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

interface OnboardingCheckProps {
  userId: string
  onboardingCompleted: boolean
  onboardingSkipped?: boolean
  accountCount?: number
  transactionCount?: number
  categoryCount?: number
}

export function OnboardingCheck({
  userId,
  onboardingCompleted,
  onboardingSkipped,
  accountCount = 0,
  transactionCount = 0,
  categoryCount = 0,
}: OnboardingCheckProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    console.log('🔍 OnboardingCheck mounted with:', {
      onboardingCompleted,
      onboardingSkipped,
      accountCount,
    })
  }, [])

  // Generate smart message based on what's been done
  useEffect(() => {
    if (accountCount === 0) {
      setMessage('Let\'s start by adding your first account to track your money.')
    } else if (categoryCount === 0) {
      setMessage(`Great! You have ${accountCount} account${accountCount !== 1 ? 's' : ''}. Now let's create categories to organize everything.`)
    } else if (transactionCount === 0) {
      setMessage('Awesome! Categories are set. Let\'s record your first transaction to finish setup.')
    } else {
      setMessage('Everything looks great! You have accounts, categories, and transactions all set up.')
    }
  }, [accountCount, categoryCount, transactionCount])

  // Don't show if already completed or if user explicitly skipped
  if (onboardingCompleted || onboardingSkipped) {
    console.log('✅ HIDING wizard - onboardingCompleted:', onboardingCompleted)
    return null
  }

  console.log('📱 SHOWING wizard')

  return (
    <OnboardingWizard
      key={`${accountCount}-${categoryCount}-${transactionCount}`}
      userId={userId}
      accountCount={accountCount}
      transactionCount={transactionCount}
      categoryCount={categoryCount}
      message={message}
      onComplete={() => {
        window.location.reload()
      }}
    />
  )
}
