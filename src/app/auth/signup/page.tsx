'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingUp, Target, PieChart, Zap } from 'lucide-react'

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Track Spending',
    description: 'Monitor your expenses across all accounts in one place'
  },
  {
    icon: Target,
    title: 'Set Goals',
    description: 'Create and track financial goals with progress visualization'
  },
  {
    icon: PieChart,
    title: 'Budget Control',
    description: 'Set category budgets and get alerts when spending exceeds limits'
  },
  {
    icon: Zap,
    title: 'Smart Insights',
    description: 'Get actionable insights about your spending patterns'
  }
]

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // Redirect to sign in after successful registration
      router.push('/auth/signin?registered=true')
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left side - Hero section */}
        <div className="hidden lg:flex flex-col justify-center px-16 py-12 bg-gradient-to-br from-background to-secondary/30">
          <div className="space-y-10">
            <div className="space-y-6">
              <h1 className="text-6xl font-bold text-foreground leading-tight">
                Start Your Financial Journey
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join thousands taking control of their personal finances today.
              </p>
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 gap-8 mt-16">
              {BENEFITS.map((benefit, idx) => {
                const Icon = benefit.icon
                return (
                  <div key={idx} className="flex gap-5">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-primary/15 border border-primary/20">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mt-12">
              <p className="text-sm text-foreground font-semibold mb-2">🎯 Get started in 30 seconds</p>
              <p className="text-sm text-muted-foreground">No credit card required. Free forever.</p>
            </div>
          </div>
        </div>

        {/* Right side - Sign up form */}
        <div className="flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-0">
          <div className="max-w-sm w-full mx-auto">
            <div className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-foreground">
                  Create Account
                </h2>
                <p className="text-lg text-muted-foreground">
                  Start managing your finances smarter
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-muted-foreground font-medium">At least 8 characters</p>
                </div>

                <div className="space-y-3">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-base font-semibold"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-background text-muted-foreground font-medium">
                    Already have an account?
                  </span>
                </div>
              </div>

              {/* Sign in link */}
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full py-3 text-base font-semibold">
                  Sign In
                </Button>
              </Link>

              {/* Footer */}
              <p className="text-center text-sm text-muted-foreground mt-8">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary hover:underline font-medium">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:underline font-medium">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
