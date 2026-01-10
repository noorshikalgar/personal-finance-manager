'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const GOAL_CATEGORIES = [
  { value: 'SAVINGS', label: 'Savings', icon: '💰' },
  { value: 'DEBT_PAYOFF', label: 'Debt Payoff', icon: '📉' },
  { value: 'EMERGENCY_FUND', label: 'Emergency Fund', icon: '🚨' },
  { value: 'INVESTMENT', label: 'Investment', icon: '📈' },
  { value: 'VACATION', label: 'Vacation', icon: '✈️' },
  { value: 'HOME', label: 'Home', icon: '🏠' },
  { value: 'EDUCATION', label: 'Education', icon: '🎓' },
  { value: 'CAR', label: 'Car', icon: '🚗' },
  { value: 'OTHER', label: 'Other', icon: '⭐' },
];

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
  deadline?: string;
}

export default function EditGoalPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Goal | null>(null);

  useEffect(() => {
    if (!goalId) return;
    fetchGoal();
  }, [goalId]);

  const fetchGoal = async () => {
    try {
      // Fetch from goals API and find the specific goal
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error('Failed to fetch goal');
      const data = await res.json();
      const goal = data.goals.find((g: Goal) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      setFormData({
        ...goal,
        deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleCategorySelect = (category: string) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, category } : null);
  };

  const handleStatusChange = (status: string) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, status } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    setError(null);
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        targetAmount: parseFloat(String(formData.targetAmount)),
        currentAmount: parseFloat(String(formData.currentAmount)),
        status: formData.status,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      };

      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update goal');
      }

      router.push('/dashboard/goals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/goals">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="h-10 bg-muted rounded animate-pulse w-64" />
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/goals">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Goals
          </Button>
        </Link>
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">{error || 'Goal not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/goals">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Edit Goal</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Goal Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.category === cat.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="text-xl">{cat.icon}</div>
                  <div className="mt-1">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Amount ($)</label>
              <input
                type="number"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Current Amount ($)</label>
              <input
                type="number"
                name="currentAmount"
                value={formData.currentAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Deadline</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Status</label>
            <div className="flex gap-2">
              {['ACTIVE', 'COMPLETED', 'ABANDONED'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.status === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
          <Link href="/dashboard/goals">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
