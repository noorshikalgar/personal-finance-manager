'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { X, AlertTriangle } from 'lucide-react'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export default function DeleteAccountModal({ isOpen, onClose, userEmail }: DeleteAccountModalProps) {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const expectedText = 'delete my account'

  const handleDelete = async () => {
    if (confirmText !== expectedText) {
      setError('Please type the confirmation text exactly as shown')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Account deleted successfully, sign out and redirect
      await signOut({ callbackUrl: '/auth/signin?deleted=true' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-card rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center mr-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Delete Account</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <h3 className="font-semibold text-destructive mb-2">⚠️ Warning: This action cannot be undone</h3>
              <p className="text-sm text-destructive/80">
                Deleting your account will:
              </p>
              <ul className="list-disc list-inside text-sm text-destructive/80 mt-2 space-y-1">
                <li>Permanently delete all your accounts</li>
                <li>Permanently delete all your transactions</li>
                <li>Permanently delete all your categories</li>
                <li>Permanently delete all recurring transactions</li>
                <li>Export your data before deletion (downloaded automatically)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Your account: <strong>{userEmail}</strong>
              </p>
              <p className="text-sm text-foreground">
                To confirm deletion, type <strong className="font-mono bg-secondary px-2 py-0.5 rounded">{expectedText}</strong> below:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value)
                  setError('')
                }}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-destructive font-mono text-sm"
                placeholder={expectedText}
                disabled={loading}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="bg-secondary border border-border rounded-lg p-3">
              <p className="text-xs text-foreground/70">
                <strong>Note:</strong> Before deletion, all your data will be exported and downloaded automatically. Please wait for the download to complete.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-secondary">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={loading || confirmText !== expectedText}
              className="bg-destructive hover:bg-destructive/80 text-white"
            >
              {loading ? 'Deleting...' : 'Delete My Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
