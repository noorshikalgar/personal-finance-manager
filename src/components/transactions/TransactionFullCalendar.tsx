'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import '@/app/fullcalendar.css';
import { Transaction } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface TransactionFullCalendarProps {
  transactions: Transaction[];
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export function TransactionFullCalendar({
  transactions,
  accounts,
  categories,
}: TransactionFullCalendarProps) {
  const router = useRouter();
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedAccount !== 'all' && t.accountId !== selectedAccount) return false;
      if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      return true;
    });
  }, [transactions, selectedAccount, selectedCategory, selectedType]);

  const events = useMemo(() => {
    return filteredTransactions.map((transaction) => {
      const amount = Number(transaction.amount).toFixed(0);
      const prefix = transaction.type === 'INCOME' ? '+' : '-';
      const description = transaction.note || 'No description';
      
      return {
        id: transaction.id,
        title: `${prefix}₹${amount} ${description}`,
        start: new Date(transaction.date),
        allDay: true,
        extendedProps: {
          transaction,
        },
        backgroundColor: transaction.type === 'INCOME' ? '#10b981' : '#ef4444',
        borderColor: transaction.type === 'INCOME' ? '#059669' : '#dc2626',
        textColor: '#ffffff',
      };
    });
  }, [filteredTransactions]);

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    return filteredTransactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getFullYear() === selectedDate.getFullYear() &&
        txDate.getMonth() === selectedDate.getMonth() &&
        txDate.getDate() === selectedDate.getDate()
      );
    });
  }, [filteredTransactions, selectedDate]);

  const totalIncome = selectedDayTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = selectedDayTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDate(arg.date);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedDate(clickInfo.event.start);
  };

  const handleAddTransaction = () => {
    if (!selectedDate) return;
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    router.push(`/dashboard/transactions/new?date=${dateStr}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Account</label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="fullcalendar-wrapper">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={events}
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek',
                  }}
                  height="auto"
                  eventDisplay="block"
                  dayMaxEvents={3}
                  eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short',
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'Select a date'}
              </CardTitle>
              {selectedDate && (
                <Button
                  size="sm"
                  onClick={handleAddTransaction}
                  className="h-8 w-8 p-0"
                  title="Add new transaction"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedDate && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Income: </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ₹{totalIncome.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Expense: </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    ₹{totalExpense.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Net: </span>
                  <span
                    className={`font-semibold ${
                      totalIncome - totalExpense >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    ₹{(totalIncome - totalExpense).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedDayTransactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {selectedDate 
                  ? 'No transactions on this date. Click the + button above to add one!' 
                  : 'Click on any date in the calendar to view transactions'}
              </p>
            ) : (
              <div className="space-y-3 max-h-125 overflow-y-auto">
                {selectedDayTransactions.map((transaction) => {
                  const account = accounts.find((a) => a.id === transaction.accountId);
                  const category = categories.find((c) => c.id === transaction.categoryId);
                  const description = transaction.note || 'No description';

                  return (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-start p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{description}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant={transaction.type === 'INCOME' ? 'default' : 'destructive'}>
                            {transaction.type}
                          </Badge>
                          {account && <Badge variant="outline">{account.name}</Badge>}
                          {category && <Badge variant="secondary">{category.name}</Badge>}
                        </div>
                      </div>
                      <div
                        className={`font-semibold text-right ml-4 whitespace-nowrap ${
                          transaction.type === 'INCOME'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+₹' : '-₹'}{Number(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
