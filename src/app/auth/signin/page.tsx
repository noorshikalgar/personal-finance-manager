'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
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

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
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
                Take Control of Your Money
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Simple, powerful personal finance management. No jargon, just results.
              </p>
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 gap-8 mt-16">
              {BENEFITS.map((benefit, idx) => {
                const Icon = benefit.icon
                return (
                  <div key={idx} className="flex gap-5">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-14 w-14 rounded-surface bg-primary/15 border border-primary/20 shadow-elevation-1">
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

            {/* Social proof */}
            <div className="bg-card/40 backdrop-blur border border-border rounded-surface shadow-elevation-1 p-6 mt-12">
              <p className="text-sm text-muted-foreground font-medium mb-3">✨ Trusted by thousands</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 ${
                    i === 1 ? 'bg-primary/30 border-primary/50' :
                    i === 2 ? 'bg-accent/30 border-accent/50' :
                    'bg-secondary/50 border-secondary'
                  }`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign in form */}
        <div className="flex flex-col justify-center px-8 lg:px-16 py-12 lg:py-0">
          <div className="max-w-sm w-full mx-auto">
            <div className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-foreground">
                  Welcome back
                </h2>
                <p className="text-lg text-muted-foreground">
                  Sign in to your financial dashboard
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
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-base font-semibold"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-background text-muted-foreground font-medium">
                    New user?
                  </span>
                </div>
              </div>

              {/* Sign up link */}
              <Link href="/auth/signup">
                <Button variant="outline" className="w-full py-3 text-base font-semibold">
                  Create Account
                </Button>
              </Link>

              {/* Footer */}
              <p className="text-center text-sm text-muted-foreground mt-8">
                By signing in, you agree to our{' '}
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
