import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { calculateSettlement } from '../services/settlementEngine';
import { formatCurrency, getMonthLabel } from '../utils/money';
import { CURRENT_MONTH, USERS } from '../constants';
import { ArrowRight, Wallet, Users, Receipt, Trash2, Edit2, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrotherId, Expense, MonthlySettlement } from '../types';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { QuickActionButton } from '../components/QuickActionButton';
import { getCategoryIcon, getCategoryColor } from '../utils/categoryIcons';

interface DashboardProps {
  currentUser: BrotherId;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_MONTH);
  const [settlement, setSettlement] = useState<MonthlySettlement | null>(null);
  const [prevSettlement, setPrevSettlement] = useState<MonthlySettlement | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const loadData = async () => {
    try {
      const allExpenses = await dataService.getExpenses();

      // Get recent household expenses for the selected month
      const householdExpenses = allExpenses
        .filter(e => e.type === 'HOUSEHOLD' && e.date.startsWith(selectedMonth))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4);

      setRecentExpenses(householdExpenses);

      // Calculate category breakdown
      const currentMonthExpenses = allExpenses.filter(e =>
        e.type === 'HOUSEHOLD' && e.date.startsWith(selectedMonth)
      );
      const categoryTotals = currentMonthExpenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

      const catData = Object.entries(categoryTotals)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      setCategoryData(catData);

      const salaryData = await dataService.getSalaryForMonth(selectedMonth);
      const recurring = await dataService.getRecurringExpenses();
      const result = calculateSettlement(selectedMonth, allExpenses, salaryData, recurring);
      setSettlement(result);

      // Get previous month data for comparison
      const prevDate = new Date(selectedMonth + '-01');
      prevDate.setMonth(prevDate.getMonth() - 1);
      const prevMonth = prevDate.toISOString().slice(0, 7);
      const prevSalaryData = await dataService.getSalaryForMonth(prevMonth);
      const prevResult = calculateSettlement(prevMonth, allExpenses, prevSalaryData, recurring);
      setPrevSettlement(prevResult);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    if (expense.paidBy !== currentUser) {
      toast.error('You can only delete your own expenses');
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <p className="font-medium">Delete this expense?</p>
            <p className="text-sm text-slate-300">
              {formatCurrency(expense.amount)} - {expense.category}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="flex-1 bg-slate-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        { duration: 10000 }
      );
    });

    if (!confirmed) return;

    try {
      await dataService.deleteExpense(expense.id);
      toast.success('Expense deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    if (expense.paidBy !== currentUser) {
      toast.error('You can only edit your own expenses');
      return;
    }
    setEditingExpense(expense);
  };

  const handleSaveEdit = async (updates: Partial<Expense>) => {
    if (!editingExpense) return;

    try {
      await dataService.updateExpense(editingExpense.id, updates);
      toast.success('Expense updated successfully');
      setEditingExpense(null);
      await loadData();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
      throw error;
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

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

  if (loading || !settlement) {
    return (
      <div className="space-y-6 pb-20">
        {/* Skeleton for Header Stats */}
        <div className="bg-slate-800 rounded-2xl p-6 space-y-3">
          <div className="skeleton h-4 w-24 rounded bg-slate-700"></div>
          <div className="skeleton h-10 w-32 rounded bg-slate-700"></div>
          <div className="skeleton h-3 w-40 rounded bg-slate-700"></div>
        </div>

        {/* Skeleton for Month Selector */}
        <div className="bg-slate-700 rounded-2xl p-4">
          <div className="skeleton h-10 w-full rounded bg-slate-600"></div>
        </div>

        {/* Skeleton for Balance Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-3 rounded-xl border border-slate-100">
              <div className="skeleton w-8 h-8 rounded-full mx-auto mb-2"></div>
              <div className="skeleton h-4 w-16 mx-auto rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      {/* Header Stats */}
      <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl">
        <p className="text-slate-400 text-sm font-medium mb-1">{getMonthLabel(selectedMonth)}</p>
        <h2 className="text-3xl font-bold tracking-tight">{formatCurrency(settlement.totalExpense)}</h2>
        <p className="text-slate-400 text-xs mt-2">Total Household Expenses</p>
      </div>

      {/* Month Selector */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>

          <div className="text-center">
            <p className="text-white text-lg font-bold">{getMonthLabel(selectedMonth)}</p>
            <p className="text-slate-400 text-xs">Tap arrows to navigate</p>
          </div>

          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      {/* Monthly Comparison */}
      {prevSettlement && (
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-5 border border-emerald-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Monthly Comparison</h3>
            <div className="text-xs text-slate-500">vs Previous Month</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                {settlement.totalExpense <= prevSettlement.totalExpense ? (
                  <TrendingDown size={16} className="text-emerald-600" />
                ) : (
                  <TrendingUp size={16} className="text-red-600" />
                )}
                <span className="text-xs text-slate-600 font-medium">Total Spent</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(settlement.totalExpense)}</p>
              {prevSettlement.totalExpense > 0 && (
                <p className={`text-xs font-semibold mt-1 ${settlement.totalExpense <= prevSettlement.totalExpense
                  ? 'text-emerald-600'
                  : 'text-red-600'
                  }`}>
                  {settlement.totalExpense <= prevSettlement.totalExpense ? '↓' : '↑'}{' '}
                  {Math.abs(((settlement.totalExpense - prevSettlement.totalExpense) / prevSettlement.totalExpense) * 100).toFixed(1)}%
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={16} className="text-blue-600" />
                <span className="text-xs text-slate-600 font-medium">Your Share</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {formatCurrency(settlement.shares[currentUser])}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Based on salary ratio
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Categories Chart */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-emerald-600" />
            <h3 className="font-bold text-slate-800">Top Categories</h3>
          </div>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => {
                    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {categoryData.map((cat, idx) => {
              const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-red-500'];
              const percentage = (cat.value / settlement.totalExpense) * 100;
              return (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colors[idx]}`}></div>
                    <span className="text-slate-700">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{formatCurrency(cat.value)}</span>
                    <span className="text-xs text-slate-400 ml-2">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Balance Preview */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Current Standing</h3>
          <Link to="/settlement" className="text-xs text-emerald-600 font-semibold flex items-center">
            Details <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {USERS.map(user => {
            const bal = settlement.balances[user.id];
            const isPositive = bal > 0;
            const isZero = Math.abs(bal) < 1;

            return (
              <div key={user.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                <div className={`w-8 h-8 mx-auto rounded-full ${user.avatarColor} text-white flex items-center justify-center text-xs font-bold mb-2`}>
                  {user.name[0]}
                </div>
                <p className={`text-xs font-bold ${isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {isZero ? 'Settled' : (isPositive ? '+' : '') + formatCurrency(bal)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Balance</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm">Recent Transactions</h3>
          </div>
          <Link to="/expenses" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View All →
          </Link>
        </div>

        <div className="space-y-3">
          {recentExpenses.length > 0 ? (
            recentExpenses.map(expense => {
              const user = USERS.find(u => u.id === expense.paidBy);
              return (
                <div key={expense.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${user?.avatarColor} flex items-center justify-center`}>
                      <span className="text-xs font-bold text-white">{user?.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{expense.category}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        Paid by {user?.name}
                        {expense.intent === 'HELPING' && <span className="text-purple-500 font-medium">• Gift</span>}
                        {expense.intent === 'EQUALLY' && <span className="text-blue-500 font-medium">• Equal Split</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="block font-bold text-slate-700 text-sm">{formatCurrency(expense.amount)}</span>
                      <span className="text-[10px] text-slate-400">{expense.date.slice(5)}</span>
                    </div>
                    {expense.paidBy === currentUser && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-300 hover:text-blue-500 transition-all"
                          title="Edit expense"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all"
                          title="Delete entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm">No expenses yet this month.</p>
            </div>
          )}
        </div>
      </div>

      {/* Paid Summary */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Total Paid</h3>
            <p className="text-xs text-slate-500">By brother (Household Total)</p>
          </div>
        </div>

        <div className="space-y-3">
          {USERS.map(user => (
            <div key={user.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
              <span className="text-slate-600">{user.name}</span>
              <span className="font-semibold text-slate-800">{formatCurrency(settlement.paid[user.id])}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex gap-3">
          <Users className="text-emerald-600 shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-emerald-800 text-sm">Salary Logic Active</h4>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Splitting is calculated based on current monthly salaries.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          currentUser={currentUser}
          onClose={() => setEditingExpense(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Quick Action Button */}
      <QuickActionButton />
    </div>
  );
};