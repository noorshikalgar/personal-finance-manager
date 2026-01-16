'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, Plus, Edit2, Trash2, Check, AlertCircle, Calendar } from 'lucide-react';
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext';

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

export default function GoalsPage() {
  const { formatAmount } = useAmountVisibility();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

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

  const deleteGoal = async (id: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGoals(goals.filter(g => g.id !== id));
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const getFilteredGoals = () => {
    if (filter === 'active') return goals.filter(g => g.status === 'ACTIVE');
    if (filter === 'completed') return goals.filter(g => g.status === 'COMPLETED');
    return goals;
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

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-accent';
    if (progress >= 80) return 'bg-amber-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-primary';
  };

  const filteredGoals = getFilteredGoals();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <Link href="/dashboard/goals/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {goals.length} goals · {goals.filter(g => g.status === 'COMPLETED').length} completed
          </p>
        </div>
        <Link href="/dashboard/goals/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          All ({goals.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          Active ({goals.filter(g => g.status === 'ACTIVE').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-primary text-primary-foreground'
              : 'bg-card border border-border text-foreground hover:bg-muted'
          }`}
        >
          Completed ({goals.filter(g => g.status === 'COMPLETED').length})
        </button>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Target className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">No goals in this category</p>
          {filter === 'all' && (
            <Link href="/dashboard/goals/new">
              <Button>Create Your First Goal</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredGoals.map(goal => (
            <div key={goal.id} className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {goal.status === 'COMPLETED' && (
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-accent" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{goal.title}</h2>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/goals/${goal.id}/edit`}>
                    <Button variant="outline" size="icon">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-border hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${getCategoryColor(goal.category)}`}>
                  {goal.category.replace(/_/g, ' ')}
                </span>
                {goal.status === 'COMPLETED' && (
                  <span className="inline-block px-3 py-1 rounded-lg text-sm font-medium bg-accent/20 text-accent">
                    Completed
                  </span>
                )}
                {goal.daysRemaining && goal.daysRemaining > 0 && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {goal.daysRemaining} days left
                  </span>
                )}
                {goal.daysRemaining && goal.daysRemaining <= 0 && goal.status === 'ACTIVE' && (
                  <span className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Overdue
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatAmount(Number(goal.currentAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatAmount(Number(goal.targetAmount))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatAmount(Number(goal.remaining))}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getProgressColor(goal.progress)}`}
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">{goal.progress.toFixed(1)}% complete</span>
                  {goal.progress >= 100 ? (
                    <span className="text-xs font-medium text-accent">Goal reached! 🎉</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
