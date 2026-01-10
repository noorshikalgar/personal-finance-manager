'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, Calendar, AlertCircle } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  deadline?: string;
  createdAt: string;
  progress: number;
  remaining: number;
  daysRemaining?: number;
}

export function GoalsTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data.goals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-accent';
      case 'ABANDONED':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-accent';
    if (progress >= 80) return 'bg-amber-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-primary';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      SAVINGS: 'bg-green-500/10 text-green-700 dark:text-green-400',
      DEBT_PAYOFF: 'bg-red-500/10 text-red-700 dark:text-red-400',
      EMERGENCY_FUND: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      INVESTMENT: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
      VACATION: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
      HOME: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
      EDUCATION: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
      CAR: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
      OTHER: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    };
    return colors[category] || colors.OTHER;
  };

  const activeGoals = goals.filter(g => g.status === 'ACTIVE').slice(0, 3);
  const completedCount = goals.filter(g => g.status === 'COMPLETED').length;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Financial Goals
            </h2>
            <p className="text-sm text-muted-foreground">Track your savings and financial objectives</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-muted rounded h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Financial Goals
            </h2>
            <p className="text-sm text-muted-foreground">Track your savings and financial objectives</p>
          </div>
        </div>
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No goals set yet. Create one to start tracking!</p>
          <Link href="/dashboard/goals/new">
            <Button>Create Your First Goal</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Financial Goals
          </h2>
          <p className="text-sm text-muted-foreground">
            {activeGoals.length} active · {completedCount} completed
          </p>
        </div>
        <Link href="/dashboard/goals">
          <Button variant="outline">View All</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {activeGoals.map(goal => (
          <div key={goal.id} className="bg-background/50 border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-foreground">{goal.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(goal.category)}`}>
                    {goal.category.replace(/_/g, ' ')}
                  </span>
                  {goal.daysRemaining && goal.daysRemaining > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {goal.daysRemaining} days left
                    </span>
                  )}
                  {goal.daysRemaining && goal.daysRemaining <= 0 && goal.status === 'ACTIVE' && (
                    <span className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
                  ${Number(goal.currentAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground">
                  of ${Number(goal.targetAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getProgressColor(goal.progress)}`}
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {goal.progress.toFixed(1)}% complete
              </span>
              <span className="text-xs font-medium">
                {goal.remaining > 0 ? `$${Number(goal.remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining` : 'Goal reached! 🎉'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {goals.length > 3 && (
        <div className="mt-4 text-center">
          <Link href="/dashboard/goals">
            <Button variant="outline">View All {goals.length} Goals</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
