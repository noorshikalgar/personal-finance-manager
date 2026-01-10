import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncOnboardingProgress, analyzeUserOnboardingStatus } from '@/lib/onboarding'

// Step definitions for onboarding (must match frontend order)
const STEPS = {
  WELCOME: 0,
  ADD_ACCOUNT: 1,
  ADD_CATEGORY: 2,
  ADD_TRANSACTION: 3,
  DONE: 4,
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔗 API called: complete-onboarding')
    const session = await auth()
    console.log('👤 Session:', session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('📦 Request body:', body)
    const { action, skipTour, syncStatus, complete } = body

    const userId = session.user.id

    // CASE 1: User wants to skip tour
    if (skipTour === true) {
      console.log('📍 CASE 1: Skip tour')
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCompleted: true,
          onboardingSkipped: true,
          onboardingCurrentStep: STEPS.DONE,
        },
      })

      return NextResponse.json({
        success: true,
        message: '✋ Tour skipped! You can always restart it from settings.',
        completed: true,
      })
    }

    // CASE 2: Sync status (check user's actual data and update onboarding)
    if (syncStatus === true) {
      console.log('📍 CASE 2: Sync status')
      try {
        const status = await syncOnboardingProgress(userId)

        return NextResponse.json({
          success: true,
          ...status,
          message: status.message,
        })
      } catch (error) {
        console.error('Error syncing onboarding progress:', error)
        return NextResponse.json(
          { error: 'Failed to sync progress' },
          { status: 500 }
        )
      }
    }

    // CASE 3: Track action completion
    if (action && typeof action === 'string') {
      console.log('📍 CASE 3: Track action:', action)
      // First, sync the current status based on actual data
      const status = await analyzeUserOnboardingStatus(userId)

      // Mark action as completed
      const completedActions = [...new Set([...status.completedSteps, action])]
      const allRequired = ['add_account', 'add_category', 'add_transaction']
      const filteredCompletedActions = completedActions.filter((step) =>
        allRequired.includes(step)
      )

      // Check if user has completed all required steps
      const completedRequired = allRequired.filter((s) =>
        filteredCompletedActions.includes(s)
      )
      const isComplete = completedRequired.length === allRequired.length

      // Determine next step
      const stepLookup: Record<string, number> = {
        add_account: STEPS.ADD_ACCOUNT,
        add_category: STEPS.ADD_CATEGORY,
        add_transaction: STEPS.ADD_TRANSACTION,
      }

      let nextStep = STEPS.DONE
      if (!isComplete) {
        const nextNeeded = status.neededSteps.find(
          (step) => !filteredCompletedActions.includes(step)
        )
        nextStep = nextNeeded ? stepLookup[nextNeeded] ?? status.nextStep : status.nextStep
      }

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          onboardingCurrentStep: nextStep,
          onboardingCompletedActions: filteredCompletedActions,
        },
      })

      // Generate smart message
      let message = ''
      if (action === 'add_account') {
        message = `✅ Great! Account created. Now let's create categories!`
      } else if (action === 'add_category') {
        message = `✅ Perfect! Categories set up. Now let's record your first transaction!`
      } else if (action === 'add_transaction') {
        message = `✅ Awesome! You're all set up!`
      }

      return NextResponse.json({
        success: true,
        message,
        currentStep: nextStep,
        completed: isComplete,
        completedActions: filteredCompletedActions,
        nextAction: isComplete ? null : status.neededSteps.find((s) => !filteredCompletedActions.includes(s)),
      })
    }

    // CASE 4: Final completion
    if (complete === true) {
      console.log('📍 CASE 4: Final completion for user:', userId)
      console.log('🔍 BEFORE UPDATE - Querying database...')
      const userBefore = await prisma.user.findUnique({ where: { id: userId } })
      console.log('BEFORE:', JSON.stringify({ id: userBefore?.id, onboardingCompleted: userBefore?.onboardingCompleted, onboardingCurrentStep: userBefore?.onboardingCurrentStep }))
      
      if (!userBefore) {
        console.error('❌ USER NOT FOUND:', userId)
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      try {
        console.log('🔄 Attempting Prisma update...')
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
            onboardingCompleted: true,
            onboardingCurrentStep: STEPS.DONE,
          },
        })
        console.log('✅ Prisma update returned:', JSON.stringify({ 
          id: updated.id, 
          onboardingCompleted: updated.onboardingCompleted,
          onboardingCurrentStep: updated.onboardingCurrentStep 
        }))
        
        // Force a disconnect to flush any connection pool issues
        console.log('🔄 Disconnecting Prisma to flush connection pool...')
        await prisma.$disconnect()
        
        // Verify the update by reading it back immediately with fresh connection
        console.log('🔍 AFTER UPDATE - Reading from database to verify persistence...')
        const userAfter = await prisma.user.findUnique({ where: { id: userId } })
        console.log('AFTER:', JSON.stringify({ id: userAfter?.id, onboardingCompleted: userAfter?.onboardingCompleted, onboardingCurrentStep: userAfter?.onboardingCurrentStep }))
        
        if (userAfter?.onboardingCompleted === true) {
          console.log('✅✅ VERIFIED: Database persistence SUCCESS')
        } else {
          console.error('❌ VERIFICATION FAILED: Database still has onboardingCompleted =', userAfter?.onboardingCompleted)
        }
      } catch (updateError) {
        console.error('❌ PRISMA UPDATE ERROR:', JSON.stringify(updateError))
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: '🎉 You\'re all set! Welcome to the app!',
        completed: true,
      })
    }

    // Default: Invalid request
    console.log('❌ No valid case matched. Body was:', JSON.stringify(body))
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error in onboarding endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
