import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json'
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all user data
    const [user, accounts, transactions, categories, recurringTransactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: {
          account: true,
          category: true,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      }),
      prisma.recurringTransaction.findMany({
        where: { userId },
        include: {
          account: true,
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (format === 'excel') {
      // Create Excel workbook with proper formatting
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Personal Finance Manager'
      workbook.created = new Date()

      // User Info Sheet
      const userSheet = workbook.addWorksheet('User Info', {
        properties: { tabColor: { argb: 'FF4472C4' } }
      })
      userSheet.columns = [
        { header: 'Field', key: 'field', width: 25 },
        { header: 'Value', key: 'value', width: 40 },
      ]
      userSheet.addRows([
        { field: 'Email', value: user.email },
        { field: 'Account Created', value: user.createdAt.toLocaleDateString() },
        { field: 'Last Updated', value: user.updatedAt.toLocaleDateString() },
        { field: 'Export Date', value: new Date().toLocaleDateString() },
      ])
      userSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      userSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } }

      // Accounts Sheet
      const accountsSheet = workbook.addWorksheet('Accounts', {
        properties: { tabColor: { argb: 'FF70AD47' } }
      })
      accountsSheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Current Balance', key: 'currentBalance', width: 18 },
        { header: 'Monthly Income', key: 'monthlyIncome', width: 18 },
        { header: 'Total Limit', key: 'totalLimit', width: 15 },
        { header: 'Available Limit', key: 'availableLimit', width: 18 },
        { header: 'Created', key: 'createdAt', width: 15 },
      ]
      accounts.forEach((account: any) => {
        accountsSheet.addRow({
          name: account.name,
          type: account.type,
          currentBalance: parseFloat(account.currentBalance?.toString() || '0'),
          monthlyIncome: account.monthlyIncome ? parseFloat(account.monthlyIncome.toString()) : null,
          totalLimit: account.totalLimit ? parseFloat(account.totalLimit.toString()) : null,
          availableLimit: account.availableLimit ? parseFloat(account.availableLimit.toString()) : null,
          createdAt: account.createdAt.toLocaleDateString(),
        })
      })
      accountsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      accountsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } }
      // Format currency columns
      accountsSheet.getColumn('currentBalance').numFmt = '$#,##0.00'
      accountsSheet.getColumn('monthlyIncome').numFmt = '$#,##0.00'
      accountsSheet.getColumn('totalLimit').numFmt = '$#,##0.00'
      accountsSheet.getColumn('availableLimit').numFmt = '$#,##0.00'

      // Transactions Sheet
      const transactionsSheet = workbook.addWorksheet('Transactions', {
        properties: { tabColor: { argb: 'FFFFC000' } }
      })
      transactionsSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Account', key: 'account', width: 20 },
        { header: 'Type', key: 'type', width: 12 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Note', key: 'note', width: 40 },
      ]
      transactions.forEach((txn: any) => {
        const row = transactionsSheet.addRow({
          date: new Date(txn.date).toLocaleDateString(),
          account: txn.account.name,
          type: txn.type,
          amount: parseFloat(txn.amount.toString()),
          category: txn.category?.name || 'Uncategorized',
          note: txn.note || '',
        })
        // Color code by type
        if (txn.type === 'INCOME') {
          row.getCell('amount').font = { color: { argb: 'FF008000' } }
        } else if (txn.type === 'EXPENSE') {
          row.getCell('amount').font = { color: { argb: 'FFFF0000' } }
        }
      })
      transactionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      transactionsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } }
      transactionsSheet.getColumn('amount').numFmt = '$#,##0.00'

      // Categories Sheet
      const categoriesSheet = workbook.addWorksheet('Categories', {
        properties: { tabColor: { argb: 'FF9B59B6' } }
      })
      categoriesSheet.columns = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Monthly Budget', key: 'monthlyBudget', width: 18 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Created', key: 'createdAt', width: 15 },
      ]
      categories.forEach((cat: any) => {
        categoriesSheet.addRow({
          name: cat.name,
          monthlyBudget: cat.monthlyBudget ? parseFloat(cat.monthlyBudget.toString()) : null,
          color: cat.color || '',
          createdAt: cat.createdAt.toLocaleDateString(),
        })
      })
      categoriesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      categoriesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9B59B6' } }
      categoriesSheet.getColumn('monthlyBudget').numFmt = '$#,##0.00'

      // Recurring Transactions Sheet
      const recurringSheet = workbook.addWorksheet('Recurring Transactions', {
        properties: { tabColor: { argb: 'FFE74C3C' } }
      })
      recurringSheet.columns = [
        { header: 'Account', key: 'account', width: 20 },
        { header: 'Type', key: 'type', width: 12 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Note', key: 'note', width: 35 },
        { header: 'Day of Month', key: 'dayOfMonth', width: 15 },
        { header: 'Start Date', key: 'startDate', width: 12 },
        { header: 'End Date', key: 'endDate', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
      ]
      recurringTransactions.forEach((rec: any) => {
        const row = recurringSheet.addRow({
          account: rec.account.name,
          type: rec.type,
          amount: parseFloat(rec.amount.toString()),
          category: rec.category?.name || 'Uncategorized',
          note: rec.note || '',
          dayOfMonth: rec.dayOfMonth,
          startDate: new Date(rec.startDate).toLocaleDateString(),
          endDate: rec.endDate ? new Date(rec.endDate).toLocaleDateString() : '',
          status: rec.paused ? 'Paused' : 'Active',
        })
        // Color code status
        if (rec.paused) {
          row.getCell('status').font = { color: { argb: 'FFFF0000' } }
        } else {
          row.getCell('status').font = { color: { argb: 'FF008000' } }
        }
      })
      recurringSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      recurringSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE74C3C' } }
      recurringSheet.getColumn('amount').numFmt = '$#,##0.00'

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer()

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="finance-export-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    // JSON Export (without IDs)
    const exportData = {
      exportInfo: {
        email: user.email,
        exportedAt: new Date().toISOString(),
        accountCreated: user.createdAt.toISOString(),
      },
      accounts: accounts.map((account: any) => ({
        name: account.name,
        type: account.type,
        currentBalance: parseFloat(account.currentBalance?.toString() || '0'),
        monthlyIncome: account.monthlyIncome ? parseFloat(account.monthlyIncome.toString()) : null,
        totalLimit: account.totalLimit ? parseFloat(account.totalLimit.toString()) : null,
        availableLimit: account.availableLimit ? parseFloat(account.availableLimit.toString()) : null,
        billingCycleStart: account.billingCycleStart,
        dueDate: account.dueDate,
        startDate: account.startDate?.toISOString(),
        createdAt: account.createdAt.toISOString(),
      })),
      transactions: transactions.map((txn: any) => ({
        date: txn.date.toISOString(),
        accountName: txn.account.name,
        type: txn.type,
        amount: parseFloat(txn.amount.toString()),
        note: txn.note || '',
        categoryName: txn.category?.name || 'Uncategorized',
        createdAt: txn.createdAt.toISOString(),
      })),
      categories: categories.map((cat: any) => ({
        name: cat.name,
        color: cat.color || '',
        monthlyBudget: cat.monthlyBudget ? parseFloat(cat.monthlyBudget.toString()) : null,
        createdAt: cat.createdAt.toISOString(),
      })),
      recurringTransactions: recurringTransactions.map((rec: any) => ({
        accountName: rec.account.name,
        type: rec.type,
        amount: parseFloat(rec.amount.toString()),
        note: rec.note || '',
        categoryName: rec.category?.name || 'Uncategorized',
        dayOfMonth: rec.dayOfMonth,
        startDate: rec.startDate.toISOString(),
        endDate: rec.endDate ? rec.endDate.toISOString() : null,
        lastRunAt: rec.lastRunAt ? rec.lastRunAt.toISOString() : null,
        paused: rec.paused,
        createdAt: rec.createdAt.toISOString(),
      })),
    }

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(exportData, null, 2)

    // Return JSON file
    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="finance-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
