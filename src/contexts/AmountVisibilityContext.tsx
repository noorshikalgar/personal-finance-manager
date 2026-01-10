'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface AmountVisibilityContextType {
  isVisible: boolean
  toggleVisibility: () => Promise<void>
  formatAmount: (amount: number | null, currency?: string) => string
  setVisibility: (visible: boolean) => void
}

const AmountVisibilityContext = createContext<AmountVisibilityContextType | undefined>(undefined)

export function AmountVisibilityProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const checkPinRequired = async () => {
    try {
      const response = await fetch('/api/user/pin/check')
      const data = await response.json()
      return data.hasPin
    } catch (error) {
      return false
    }
  }

  const verifyPin = async (pin: string) => {
    try {
      const response = await fetch('/api/user/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await response.json()
      return data.valid
    } catch (error) {
      return false
    }
  }

  const toggleVisibility = async () => {
    // If currently visible (hiding amounts), no PIN needed
    if (isVisible) {
      setIsVisible(false)
      return
    }

    // If showing amounts, check if PIN is required
    const hasPin = await checkPinRequired()
    
    if (!hasPin) {
      // No PIN set, just show amounts
      setIsVisible(true)
      return
    }

    // Show PIN modal
    setShowPinModal(true)
  }

  const handlePinSubmit = async () => {
    if (!pinInput) {
      setPinError('Please enter your PIN')
      return
    }

    setIsVerifying(true)
    setPinError('')

    const isValid = await verifyPin(pinInput)

    if (isValid) {
      setIsVisible(true)
      setShowPinModal(false)
      setPinInput('')
      setPinError('')
    } else {
      setPinError('Incorrect PIN')
    }

    setIsVerifying(false)
  }

  const handlePinCancel = () => {
    setShowPinModal(false)
    setPinInput('')
    setPinError('')
  }

  const formatAmount = (amount: number | null, currency: string = 'USD') => {
    if (amount === null) return '-'
    
    if (!isVisible) {
      return 'XXX.XX'
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const setVisibility = (visible: boolean) => {
    setIsVisible(visible)
  }

  return (
    <AmountVisibilityContext.Provider value={{ isVisible, toggleVisibility, formatAmount, setVisibility }}>
      {children}
      
      {/* PIN Verification Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-100 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={handlePinCancel}
            />
            <div className="relative bg-card rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Enter PIN to Show Amounts
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your PIN to view financial amounts
              </p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''))
                  setPinError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePinSubmit()
                  }
                }}
                placeholder="Enter PIN"
                className="w-full px-3 py-2 border border-border rounded-md mb-2"
                autoFocus
              />
              {pinError && (
                <p className="text-sm text-red-600 mb-4">{pinError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handlePinCancel}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePinSubmit}
                  disabled={isVerifying || !pinInput}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? 'Verifying...' : 'Unlock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AmountVisibilityContext.Provider>
  )
}

export function useAmountVisibility() {
  const context = useContext(AmountVisibilityContext)
  if (context === undefined) {
    throw new Error('useAmountVisibility must be used within an AmountVisibilityProvider')
  }
  return context
}

