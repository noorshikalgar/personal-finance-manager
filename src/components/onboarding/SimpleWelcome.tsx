'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, CheckCircle2 } from 'lucide-react'

interface SimpleWelcomeProps {
  userName?: string
  onClose: () => Promise<void>
}

export function SimpleWelcome({ userName, onClose }: SimpleWelcomeProps) {
  const router = useRouter()
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = async () => {
    setIsClosing(true)
    await onClose()
    setTimeout(() => {
      router.refresh()
    }, 300)
  }

  const steps = [
    {
      icon: '🏦',
      title: 'Add Your Accounts',
      description: 'Start by adding your bank accounts, credit cards, or cash wallets.',
    },
    {
      icon: '📂',
      title: 'Create Categories',
      description: 'Organize your spending with categories like Food, Transport, Bills, etc.',
    },
    {
      icon: '💰',
      title: 'Track Transactions',
      description: 'Record your income and expenses to see where your money goes.',
    },
    {
      icon: '📊',
      title: 'Analyze & Budget',
      description: 'Set budgets, track goals, and get insights on your spending patterns.',
    },
  ]

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`bg-card border border-border rounded-lg max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                👋 Welcome{userName ? `, ${userName}` : ''}!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Let&apos;s get you started with Personal Finance Manager
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Close welcome screen"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center mb-2 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                Here&apos;s how to get the most out of your finance manager:
              </h2>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-background/50 border border-border rounded-lg p-3 sm:p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-2xl sm:text-3xl shrink-0">{step.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pro Tips */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Pro Tip</p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Start by adding at least one account and a few categories. Then you can begin tracking transactions and see your financial insights come to life!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border flex justify-center sticky bottom-0 bg-card">
          <Button
            onClick={handleClose}
            size="lg"
            className="w-full sm:w-auto px-6 sm:px-8 text-sm sm:text-base"
          >
            Got it, let&apos;s start!
          </Button>
        </div>
      </div>
    </div>
  )
}
