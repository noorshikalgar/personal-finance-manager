'use client'

import { useEffect, useState } from 'react'
import { Transaction, Account, Category } from '@prisma/client'
import { Plus, Search, Filter, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAmountVisibility } from '@/contexts/AmountVisibilityContext'

type TransactionWithRelations = Transaction & {
  account: Pick<Account, 'name' | 'type'>
  category: Pick<Category, 'name' | 'color'> | null
}

export default function TransactionsClient() {
  const { formatAmount } = useAmountVisibility()
  const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filterAccount, setFilterAccount] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    fetchAccounts()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [page, search, filterAccount, filterCategory, fromDate, toDate])

  const fetchAccounts = async () => {
    const res = await fetch('/api/accounts')
    if (res.ok) {
      const data = await res.json()
      setAccounts(data)
    }
  }

  const fetchCategories = async () => {
    const res = await fetch('/api/categories')
    if (res.ok) {
      const data = await res.json()
      setCategories(data)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '50',
    })
    if (search) params.append('search', search)
    if (filterAccount) params.append('accountId', filterAccount)
    if (filterCategory) params.append('categoryId', filterCategory)
    if (fromDate) params.append('fromDate', fromDate)
    if (toDate) params.append('toDate', toDate)

    const res = await fetch(`/api/transactions?${params}`)
    if (res.ok) {
      const data = await res.json()
      setTransactions(data.transactions)
      setTotalPages(data.pagination.totalPages)
    }
    setLoading(false)
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filterAccount) params.append('accountId', filterAccount)
      if (filterCategory) params.append('categoryId', filterCategory)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)
      params.append('export', 'true')

      const response = await fetch(`/api/transactions?${params}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export transactions')
    } finally {
      setExportLoading(false)
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      fetchTransactions()
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-card rounded-lg shadow p-4 border border-border">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                placeholder="Search by note, amount, account..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exportLoading || transactions.length === 0}
            >
              {exportLoading ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Link href="/dashboard/transactions/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </Link>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Account
                </label>
                <select
                  value={filterAccount}
                  onChange={(e) => {
                    setFilterAccount(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Accounts</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Categories</option>
                  <option value="none">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Actions</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterAccount('')
                    setFilterCategory('')
                    setFromDate('')
                    setToDate('')
                    setSearch('')
                    setPage(1)
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="bg-card rounded-lg shadow p-8 text-center border border-border">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-8 text-center border border-border">
          <p className="text-muted-foreground">No transactions found</p>
          <Link href="/dashboard/transactions/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Transaction
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-lg shadow overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-secondary">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {transaction.account.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.category ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${transaction.category.color || '#6B7280'}20`,
                              color: transaction.category.color || '#6B7280',
                            }}
                          >
                            {transaction.category.name}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {transaction.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        <span
                          className={
                            Number(transaction.amount) >= 0
                              ? 'text-accent'
                              : 'text-destructive'
                          }
                        >
                          {formatAmount(Number(transaction.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-destructive hover:text-destructive/80 ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
