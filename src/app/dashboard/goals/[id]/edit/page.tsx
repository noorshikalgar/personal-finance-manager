'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext';
import { DatePicker } from '@/components/ui/DatePicker';

type Category = {
  id: string
  name: string
  color: string | null
  goalId: string | null
}

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
  const { currency } = useAmountVisibility();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState<Goal | null>(null);

  useEffect(() => {
    if (!goalId) return;
    fetchGoal();
    fetchCategories();
  }, [goalId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        // Set initially selected categories (those linked to this goal)
        const linkedCats = data.filter((cat: Category) => cat.goalId === goalId);
        setSelectedCategories(linkedCats.map((cat: Category) => cat.id));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

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
        categoryIds: selectedCategories,
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/goals">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Goal</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Basic Info Card */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Goal Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Add details about your goal..."
              />
            </div>
          </div>
        </div>

        {/* Financial Details Card */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Financial Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Target Amount ({currency})</label>
              <input
                type="number"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Current Amount ({currency})</label>
              <input
                type="number"
                name="currentAmount"
                value={formData.currentAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Deadline (Optional)</label>
              <DatePicker
                value={formData.deadline ? new Date(formData.deadline) : null}
                onChange={(date) => handleChange({ target: { name: 'deadline', value: date ? date.toISOString().split('T')[0] : '' } } as any)}
                placeholder="Select deadline"
              />
            </div>
          </div>
        </div>

        {/* Category & Status Card */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Category & Status</h2>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Goal Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {GOAL_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorySelect(cat.value)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    formData.category === cat.value
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="text-lg">{cat.icon}</div>
                  <div className="text-[10px] leading-tight text-center">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {['ACTIVE', 'COMPLETED', 'ABANDONED'].map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  className={`px-3 py-1.5 text-xs rounded-full transition-all ${
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

        {/* Linked Categories Card */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Linked Categories</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Link categories to auto-track spending/income towards this goal
            </p>
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No categories available. Create categories first.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 ${
                    selectedCategories.includes(cat.id)
                      ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: cat.color || '#6B7280' }}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving} size="default">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
          <Link href="/dashboard/goals">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
