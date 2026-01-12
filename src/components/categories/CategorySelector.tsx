'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
  monthlyBudget: number | null
}

interface CategorySelectorProps {
  value: string
  onChange: (categoryId: string) => void
  onCategoryCreated?: () => void
  className?: string
  placeholder?: string
}

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Amber', value: '#D97706' },
  { name: 'Gray', value: '#6B7280' },
]

export default function CategorySelector({ 
  value, 
  onChange, 
  onCategoryCreated,
  className = '',
  placeholder = 'Select category (optional)'
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3B82F6')
  const [newBudget, setNewBudget] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleCreateCategory = async () => {
    setError('')
    setCreating(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          color: newColor,
          monthlyBudget: newBudget ? parseFloat(newBudget) : null,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create category')
      }

      const newCategory = await res.json()
      
      // Refresh categories list
      await fetchCategories()
      
      // Auto-select the new category
      onChange(newCategory.id)
      
      // Reset form
      setNewName('')
      setNewColor('#3B82F6')
      setNewBudget('')
      setShowCreateForm(false)

      // Notify parent component
      if (onCategoryCreated) {
        onCategoryCreated()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create category')
    } finally {
      setCreating(false)
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    
    if (selectedValue === '__create_new__') {
      setShowCreateForm(true)
      // Don't change the actual value
    } else {
      onChange(selectedValue)
    }
  }

  if (showCreateForm) {
    return (
      <div className="border-2 border-primary rounded-lg p-4 bg-card">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground text-sm">Create New Category</h4>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false)
              setError('')
              setNewName('')
              setNewBudget('')
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-500 rounded px-3 py-2 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Name *
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  e.preventDefault()
                  handleCreateCategory()
                }
              }}
              className="w-full px-3 py-1.5 text-sm border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Groceries"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.slice(0, 8).map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setNewColor(colorOption.value)
                  }}
                  className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                    newColor === colorOption.value
                      ? 'border-primary ring-2 ring-offset-1 ring-primary'
                      : 'border-border'
                  }`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Monthly Budget (optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  e.preventDefault()
                  handleCreateCategory()
                }
              }}
              className="w-full px-3 py-1.5 text-sm border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleCreateCategory()
              }}
              disabled={creating || !newName.trim()}
              className="flex-1 text-sm py-1.5 h-auto"
            >
              {creating ? 'Creating...' : 'Create & Select'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault()
                setShowCreateForm(false)
                setError('')
                setNewName('')
                setNewBudget('')
              }}
              className="flex-1 text-sm py-1.5 h-auto"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={handleSelectChange}
        className={`block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-card text-foreground ${className}`}
      >
        <option value="" className="bg-card text-foreground">{placeholder}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id} className="bg-card text-foreground">
            {category.name}
          </option>
        ))}
        <option value="__create_new__" className="bg-primary/10 text-primary font-semibold">
          + Create New Category
        </option>
      </select>
    </div>
  )
}
