import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { BrotherId, Expense } from '../types';
import { dataService } from '../services/dataService';
import { CURRENT_MONTH, USERS } from '../constants';
import { formatCurrency } from '../utils/money';
import { TrendingUp, Calendar, Wallet, Trash2 } from 'lucide-react';

interface PersonalProps {
  currentUser: BrotherId;
}

export const Personal: React.FC<PersonalProps> = ({ currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_MONTH);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [owedToMe, setOwedToMe] = useState<Array<{ userId: BrotherId; amount: number; category: string; notes: string; isRecurring: boolean }>>([]);
  const [owedByMe, setOwedByMe] = useState<Array<{ userId: BrotherId; amount: number; category: string; notes: string; isRecurring: boolean }>>([]);

  const handlePreviousMonth = () => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const getMonthLabel = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const loadData = async () => {
    try {
      const all = await dataService.getExpenses();
      const recurringExpenses = await dataService.getRecurringExpenses();

      // Filter: Current User, Selected Month, Personal Type
      const personal = all.filter(
        e => e.paidBy === currentUser &&
          e.type === 'PERSONAL' &&
          e.date.startsWith(selectedMonth) &&
          !e.paidFor // Only MY expenses (not paid for others)
      );
      setExpenses(personal);
      setTotal(personal.reduce((sum, e) => sum + e.amount, 0));

      // Calculate IOUs - money others owe me (individual transactions)
      const owedToList: Array<{ userId: BrotherId; amount: number; category: string; notes: string; isRecurring: boolean }> = [];

      // From one-time expenses
      all.filter(e => e.paidBy === currentUser && e.paidFor && e.date.startsWith(selectedMonth))
        .forEach(e => {
          if (e.paidFor) {
            owedToList.push({
              userId: e.paidFor,
              amount: e.amount,
              category: e.category,
              notes: e.notes,
              isRecurring: false
            });
          }
        });

      // From recurring expenses (PERSONAL type with paidFor)
      recurringExpenses
        .filter(re => re.isActive && re.type === 'PERSONAL' && re.paidBy === currentUser && re.paidFor)
        .forEach(re => {
          if (re.paidFor) {
            owedToList.push({
              userId: re.paidFor,
              amount: re.amount,
              category: re.category,
              notes: re.notes,
              isRecurring: true
            });
          }
        });

      setOwedToMe(owedToList);

      // Calculate IOUs - money I owe others (individual transactions)
      const owedByList: Array<{ userId: BrotherId; amount: number; category: string; notes: string; isRecurring: boolean }> = [];

      // From one-time expenses
      all.filter(e => e.paidFor === currentUser && e.date.startsWith(selectedMonth))
        .forEach(e => {
          owedByList.push({
            userId: e.paidBy,
            amount: e.amount,
            category: e.category,
            notes: e.notes,
            isRecurring: false
          });
        });

      // From recurring expenses (where I'm the paidFor person)
      recurringExpenses
        .filter(re => re.isActive && re.type === 'PERSONAL' && re.paidFor === currentUser)
        .forEach(re => {
          owedByList.push({
            userId: re.paidBy,
            amount: re.amount,
            category: re.category,
            notes: re.notes,
            isRecurring: true
          });
        });

      setOwedByMe(owedByList);
    } catch (error) {
      console.error('Error loading personal expenses:', error);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (!confirm(`Delete this ${formatCurrency(expense.amount)} ${expense.category} expense?`)) {
      return;
    }

    try {
      await dataService.deleteExpense(expense.id);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, selectedMonth]);

  // Data for Chart
  const categoryData = Object.entries(
    expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={20} />
          <h2 className="text-lg font-bold">My Personal Spending</h2>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{formatCurrency(total)}</span>
          <span className="text-primary-100 text-sm">{selectedMonth}</span>
        </div>
        <p className="text-primary-100 text-xs mt-2">{expenses.length} personal transactions this month</p>
      </div>

      {/* Month Selector */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="text-xl">←</span>
          </button>

          <div className="text-center">
            <p className="text-white text-lg font-bold">{getMonthLabel(selectedMonth)}</p>
            <p className="text-slate-400 text-xs">Tap arrows to navigate</p>
          </div>

          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="text-xl">→</span>
          </button>
        </div>
      </div>

      {/* IOUs Section */}
      {(owedToMe.length > 0 || owedByMe.length > 0) && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">IOUs & Loans</h3>

          {/* Money Owed TO Me */}
          {owedToMe.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-emerald-700 uppercase mb-3">
                💰 They Owe You
              </p>
              <div className="space-y-3">
                {Object.entries(
                  owedToMe.reduce((acc, iou) => {
                    if (!acc[iou.userId]) acc[iou.userId] = [];
                    acc[iou.userId].push(iou);
                    return acc;
                  }, {} as Record<BrotherId, typeof owedToMe>)
                ).map(([userId, ious]) => {
                  const user = USERS.find(u => u.id === userId);
                  const total = ious.reduce((sum, iou) => sum + iou.amount, 0);
                  return (
                    <div key={userId} className="bg-white p-3 rounded-lg border border-emerald-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${user?.avatarColor} flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">{user?.name[0]}</span>
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{user?.name}</span>
                        </div>
                        <span className="font-bold text-emerald-600">{formatCurrency(total)}</span>
                      </div>
                      <div className="pl-10 space-y-1">
                        {ious.map((iou, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600">{iou.category}</span>
                              {iou.isRecurring && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">RECURRING</span>
                              )}
                              {iou.notes && (
                                <span className="text-slate-400 italic max-w-[100px] truncate">• {iou.notes}</span>
                              )}
                            </div>
                            <span className="font-semibold text-emerald-600">{formatCurrency(iou.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Money I Owe */}
          {owedByMe.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-3">⚠️ You Owe Them</p>
              <div className="space-y-3">
                {Object.entries(
                  owedByMe.reduce((acc, iou) => {
                    if (!acc[iou.userId]) acc[iou.userId] = [];
                    acc[iou.userId].push(iou);
                    return acc;
                  }, {} as Record<BrotherId, typeof owedByMe>)
                ).map(([userId, ious]) => {
                  const user = USERS.find(u => u.id === userId);
                  const total = ious.reduce((sum, iou) => sum + iou.amount, 0);
                  return (
                    <div key={userId} className="bg-white p-3 rounded-lg border border-amber-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full ${user?.avatarColor} flex items-center justify-center`}>
                            <span className="text-xs font-bold text-white">{user?.name[0]}</span>
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{user?.name}</span>
                        </div>
                        <span className="font-bold text-amber-600">{formatCurrency(total)}</span>
                      </div>
                      <div className="pl-10 space-y-1">
                        {ious.map((iou, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600">{iou.category}</span>
                              {iou.isRecurring && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">RECURRING</span>
                              )}
                              {iou.notes && (
                                <span className="text-slate-400 italic max-w-[100px] truncate">• {iou.notes}</span>
                              )}
                            </div>
                            <span className="font-semibold text-amber-600">{formatCurrency(iou.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-500" />
          Spending by Category
        </h3>
        <div className="h-64">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={80} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No personal expenses yet this month
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Breakdown</h3>
        {categoryData.length > 0 ? (
          <div className="space-y-3">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                  <span className="font-medium text-slate-700">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{formatCurrency(cat.value)}</p>
                  <p className="text-xs text-slate-500">{total > 0 ? ((cat.value / total) * 100).toFixed(1) : 0}%</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-8">No expenses to show</p>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-primary-500" />
          Recent Transactions
        </h3>
        {expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.slice(0, 10).map((exp) => (
              <div key={exp.id} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="flex items-baseline gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-700 text-sm">{exp.category}</p>
                    <p className="text-xs text-slate-500 italic truncate max-w-[150px]">{exp.notes || 'No notes'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-slate-800 text-sm">{formatCurrency(exp.amount)}</p>
                  <button
                    onClick={() => handleDelete(exp)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    title="Delete Transaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-8">No transactions to show</p>
        )}
      </div>
    </div>
  );
};