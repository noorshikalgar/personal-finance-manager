'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

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

export default function CreateGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'SAVINGS',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.title || !formData.targetAmount) {
        throw new Error('Title and target amount are required');
      }

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: formData.currentAmount ? parseFloat(formData.currentAmount) : 0,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        categoryIds: selectedCategories,
      };

      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create goal');
      }

      router.push('/dashboard/goals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/goals">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create New Goal</h1>
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
                placeholder="e.g., Summer Vacation to Europe"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1.5">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add details about your goal..."
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Financial Details Card */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Financial Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Target Amount ($)</label>
              <input
                type="number"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                placeholder="5000"
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Current Amount ($)</label>
              <input
                type="number"
                name="currentAmount"
                value={formData.currentAmount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Deadline (Optional)</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Category Card */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Goal Category</h2>
          
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
          <Button type="submit" disabled={loading} size="default">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Goal
          </Button>
          <Link href="/dashboard/goals">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
