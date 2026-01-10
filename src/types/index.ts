import { Account, Transaction, Category, RecurringTransaction } from '@prisma/client'

// Types for data with Decimal converted to number
export type AccountWithNumbers = Omit<Account, 'monthlyIncome' | 'currentBalance' | 'totalLimit' | 'availableLimit'> & {
  monthlyIncome: number | null
  currentBalance: number
  totalLimit: number | null
  availableLimit: number | null
}

export type CategoryWithNumbers = Omit<Category, 'monthlyBudget'> & {
  monthlyBudget: number | null
}

export type TransactionWithNumbers = Omit<Transaction, 'amount'> & {
  amount: number
}

export type RecurringTransactionWithNumbers = Omit<RecurringTransaction, 'amount'> & {
  amount: number
}

export type TransactionWithCategory = TransactionWithNumbers & {
  category: CategoryWithNumbers | null
}

export type RecurringWithRelations = RecurringTransactionWithNumbers & {
  account: AccountWithNumbers
  category: CategoryWithNumbers | null
}
