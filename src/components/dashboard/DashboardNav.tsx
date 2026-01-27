'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import NotificationBell from '@/components/notifications/NotificationBell'
import { 
  Home, 
  CreditCard, 
  ArrowLeftRight, 
  BarChart3,
  FileDown,
  LogOut,
  Menu,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  Settings,
  Repeat,
  FolderTree,
  Target,
  Bell,
  Calendar
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'

interface DashboardNavProps {
  userEmail: string
}

const primaryNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/accounts', label: 'Accounts', icon: CreditCard },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/dashboard/analyze', label: 'Analyze', icon: BarChart3 },
]

const secondaryNavItems = [
  { href: '/dashboard/planner', label: 'Planner', icon: Calendar },
  { href: '/dashboard/categories', label: 'Categories', icon: FolderTree },
  { href: '/dashboard/recurring', label: 'Recurring', icon: Repeat },
  { href: '/dashboard/goals', label: 'Goals', icon: Target },
  { href: '/dashboard/reminders', label: 'Reminders', icon: Bell },
  { href: '/dashboard/export', label: 'Export', icon: FileDown },
]

export default function DashboardNav({ userEmail }: DashboardNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const { isVisible, toggleVisibility } = useAmountVisibility()
  const moreMenuRef = useRef<HTMLDivElement>(null)

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false)
      }
    }

    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [moreMenuOpen])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center shrink-0">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center mr-2">
              <span className="text-primary-foreground font-bold text-lg">$</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">Finance Tracker</h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="ml-2">{item.label}</span>
                </Link>
              )
            })}

            {/* More Menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                More
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {moreMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-10">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreMenuOpen(false)}
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          isActive
                            ? 'text-primary bg-primary/10'
                            : 'text-card-foreground hover:bg-muted'
                        }`}
                      >
                        {Icon && <Icon className="h-4 w-4 mr-2" />}
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            <Button
              onClick={toggleVisibility}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
              title={isVisible ? 'Hide amounts' : 'Show amounts'}
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Account Dropdown */}
            <div className="relative group">
              <button className="flex items-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                <span className="font-medium">Account</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-0 w-56 bg-card rounded-lg shadow-lg border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Signed in as</p>
                  <p className="text-sm font-medium text-card-foreground mt-1 truncate">{userEmail}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center w-full px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Notification Bell */}
            <NotificationBell />
            
            <Button
              onClick={toggleVisibility}
              variant="ghost"
              size="sm"
              title={isVisible ? 'Hide amounts' : 'Show amounts'}
            >
              {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in Menu */}
          <div className="fixed inset-y-0 left-0 w-[280px] bg-card border-r border-border z-50 md:hidden overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-border sticky top-0 bg-card">
              <Link href="/dashboard" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-primary-foreground font-bold text-lg">$</span>
                </div>
                <h1 className="text-lg font-bold text-foreground">Finance Tracker</h1>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="px-3 py-3 space-y-1">
              {[...primaryNavItems, ...secondaryNavItems].map((item) => {
                const Icon = item.icon || null
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2.5 text-base font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    {Icon && <Icon className="h-5 w-5 mr-3" />}
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Account Section */}
            <div className="border-t border-border px-3 py-4 mt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold px-3 mb-2">Account</p>
              <p className="text-sm font-medium text-foreground px-3 py-2 truncate">{userEmail}</p>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center w-full px-3 py-2.5 text-base text-foreground hover:bg-accent rounded-lg transition-colors mt-1"
              >
                <Settings className="h-5 w-5 mr-3" />
                Settings
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleSignOut()
                }}
                className="flex items-center w-full px-3 py-2.5 text-base text-destructive hover:bg-destructive/10 rounded-lg transition-colors mt-1"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
