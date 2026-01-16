'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, Download, Trash2, Shield, Database, Calendar, Info, FileSpreadsheet, DollarSign, Palette, Check } from 'lucide-react'
import DeleteAccountModal from './DeleteAccountModal'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'
import { useTheme } from '@/contexts/ThemeContext'

interface SettingsClientProps {
  user: {
    id: string
    email: string
    createdAt: string
    updatedAt: string
    pin: string | null
    currency: string
    theme: string
    accentColor: string
  }
  stats: {
    accounts: number
    transactions: number
    categories: number
    recurring: number
  }
}

export default function SettingsClient({ user, stats }: SettingsClientProps) {
  const router = useRouter()
  const { setCurrency } = useAmountVisibility()
  const themeContext = useTheme()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(user.currency || 'INR')
  const [currencyLoading, setCurrencyLoading] = useState(false)
  const [customAccentInput, setCustomAccentInput] = useState(user.accentColor || '#8b5cf6')

  const { theme, accentColor, setThemePreset, setAccentColor } = themeContext

  useEffect(() => {
    // Sync custom accent input with actual accent color
    setCustomAccentInput(accentColor)
  }, [accentColor])

  const colorThemes = [
    { id: 'violet', name: 'Violet', preview: '#8b5cf6' },
    { id: 'rose', name: 'Rose', preview: '#f43f5e' },
    { id: 'blue', name: 'Blue', preview: '#0ea5e9' },
    { id: 'green', name: 'Green', preview: '#10b981' },
    { id: 'orange', name: 'Orange', preview: '#f97316' },
    { id: 'zinc', name: 'Zinc', preview: '#71717a' },
    { id: 'tokyo-night', name: 'Tokyo Night', preview: '#7aa2f7' },
    { id: 'tokyo-light', name: 'Tokyo Light', preview: '#8c6c3e' },
  ]

  const handleExportData = async () => {
    setExportLoading(true)
    try {
      const response = await fetch('/api/user/export?format=excel')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance-data-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExportLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleSetPin = async () => {
    if (pinInput.length < 4 || pinInput.length > 6) {
      alert('PIN must be 4-6 digits')
      return
    }

    setPinLoading(true)
    try {
      const response = await fetch('/api/user/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set PIN')
      }

      setShowPinModal(false)
      setPinInput('')
      router.refresh()
      alert('PIN set successfully!')
    } catch (error) {
      console.error('Set PIN error:', error)
      alert(`Failed to set PIN: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setPinLoading(false)
    }
  }

  const handleRemovePin = async () => {
    if (!confirm('Are you sure you want to remove your PIN?')) return

    setPinLoading(true)
    try {
      const response = await fetch('/api/user/pin', {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove PIN')

      router.refresh()
      alert('PIN removed successfully!')
    } catch (error) {
      console.error('Remove PIN error:', error)
      alert('Failed to remove PIN')
    } finally {
      setPinLoading(false)
    }
  }

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrencyLoading(true)
    try {
      const response = await fetch('/api/user/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      })

      if (!response.ok) {
        throw new Error('Failed to update currency')
      }

      setSelectedCurrency(newCurrency)
      setCurrency(newCurrency)
      router.refresh()
      alert('Currency updated successfully!')
    } catch (error) {
      console.error('Currency update error:', error)
      alert('Failed to update currency')
    } finally {
      setCurrencyLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile and account preferences</p>
      </div>

      {/* Profile Information */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b border-border">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
              <p className="text-sm text-muted-foreground">Your account details and preferences</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <p className="text-foreground">{user.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">User ID</label>
            <p className="text-foreground font-mono text-sm">{user.id}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <Calendar className="inline h-4 w-4 mr-1 text-muted-foreground dark:text-muted-foreground" />
                Account Created
              </label>
              <p className="text-foreground">{formatDate(user.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Last Updated</label>
              <p className="text-foreground">{formatDate(user.updatedAt)}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Privacy PIN</label>
                <p className="text-sm text-muted-foreground">
                  {user.pin ? 'PIN is set - Use it to hide amounts on dashboard' : 'Set a PIN to hide amounts for screenshots'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPinModal(true)}
                  disabled={pinLoading}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  {user.pin ? 'Change PIN' : 'Set PIN'}
                </Button>
                {user.pin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePin}
                    disabled={pinLoading}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-1">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Preferred Currency
                </label>
                <p className="text-sm text-muted-foreground">
                  Select your preferred currency for displaying amounts
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCurrency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  disabled={currencyLoading}
                  className="px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="INR" className="bg-card text-foreground">₹ Indian Rupee (INR)</option>
                  <option value="USD" className="bg-card text-foreground">$ US Dollar (USD)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b border-border">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Palette className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
              <p className="text-sm text-muted-foreground">Customize the look and feel of your dashboard</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                Color Theme
              </label>
              <p className="text-sm text-muted-foreground">
                Choose a color theme for your dashboard. Toggle dark/light mode using the header icon.
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <select
                value={theme === 'dark' || theme === 'light' ? 'violet' : theme}
                onChange={(e) => setThemePreset(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {colorThemes.map((t) => (
                  <option key={t.id} value={t.id} className="bg-card text-foreground">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b border-border">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-muted-foreground mr-3" />
            <h2 className="text-xl font-semibold text-foreground">Account Statistics</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.accounts}</p>
              <p className="text-sm text-muted-foreground mt-1">Accounts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.transactions}</p>
              <p className="text-sm text-muted-foreground mt-1">Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.categories}</p>
              <p className="text-sm text-muted-foreground mt-1">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.recurring}</p>
              <p className="text-sm text-muted-foreground mt-1">Recurring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Data Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Export or delete your financial data</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-semibold text-foreground">Quick Export (Excel Only)</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Download your financial data in Excel format with professional formatting and color-coded sheets.
                </p>
              </div>
              <Button
                onClick={handleExportData}
                disabled={exportLoading}
                className="w-full sm:w-auto sm:ml-4"
              >
                {exportLoading ? 'Exporting...' : 'Export Excel'}
              </Button>
            </div>
            
            {/* Info Message */}
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-border">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                This quick export uses Excel format for better visualization. For other formats (JSON) or more export options,{' '}
                <Link href="/dashboard/export" className="font-semibold underline hover:text-primary">
                  visit the Export page
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between p-4 bg-card rounded-lg border border-border">
            <div className="flex-1">
              <div className="flex items-center">
                <Trash2 className="h-5 w-5 text-destructive mr-2" />
                <h3 className="font-semibold text-foreground">Delete Account</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all associated data. This action cannot be undone. Your data will be exported before deletion.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="w-full sm:w-auto sm:ml-4 text-red-600 hover:text-muted-foreground hover:bg-card border-red-300"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        userEmail={user.email}
      />

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowPinModal(false)}
            />
            <div className="relative bg-card rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {user.pin ? 'Change PIN' : 'Set PIN'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter a 4-6 digit PIN to hide amounts on the dashboard. You'll be prompted to enter this PIN when you want to view amounts.
              </p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-6 digit PIN"
                className="w-full px-3 py-2 border border-border rounded-md mb-4"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPinModal(false)
                    setPinInput('')
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSetPin} disabled={pinLoading || pinInput.length < 4}>
                  {pinLoading ? 'Setting...' : 'Set PIN'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
