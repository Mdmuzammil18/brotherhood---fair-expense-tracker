import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrotherId, ExpenseCategory, ExpenseType, ExpenseIntent, SplitMode, CustomSplit } from '../types';
import { EXPENSE_CATEGORIES, USERS, CURRENT_MONTH } from '../constants';
import { dataService } from '../services/dataService';
import { Button } from '../components/ui/Button';
import { SplitEditor } from '../components/SplitEditor';
import { User as UserIcon, Home, ListPlus } from 'lucide-react';

interface AddExpenseProps {
  currentUser: BrotherId;
}

export const AddExpense: React.FC<AddExpenseProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [type, setType] = useState<ExpenseType>('HOUSEHOLD');
  const [intent, setIntent] = useState<ExpenseIntent>('NORMAL');
  const [splitBetween, setSplitBetween] = useState<BrotherId[]>(['A', 'B', 'C']); // All selected by default
  const [paidFor, setPaidFor] = useState<BrotherId | null>(null); // For IOUs - who this expense is for
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Custom split state
  const [splitMode, setSplitMode] = useState<SplitMode>('SALARY_RATIO');
  const [customSplit, setCustomSplit] = useState<CustomSplit>({ A: 0, B: 0, C: 0 });

  const toggleSplitPerson = (id: BrotherId) => {
    setSplitBetween(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    // Validation for household expenses
    if (type === 'HOUSEHOLD' && (intent === 'NORMAL' || intent === 'EQUALLY') && splitBetween.length === 0) {
      alert('Please select at least one person to split with');
      return;
    }

    // Validate custom splits
    if (type === 'HOUSEHOLD' && splitMode === 'PERCENTAGE') {
      const total = Object.values(customSplit).reduce((sum: number, val: number) => sum + val, 0);
      if (Math.abs(total - 100) > 0.01) {
        alert('Custom percentages must total 100%');
        return;
      }
    }

    if (type === 'HOUSEHOLD' && splitMode === 'FIXED_AMOUNT') {
      const total = Object.values(customSplit).reduce((sum: number, val: number) => sum + val, 0);
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        alert(`Custom amounts must total ₹${amount}`);
        return;
      }
    }

    try {
      await dataService.addExpense({
        id: Date.now().toString(),
        amount: parseFloat(amount),
        category,
        type,
        paidBy: currentUser,
        intent: type === 'PERSONAL' ? 'NORMAL' : intent,
        splitBetween: type === 'HOUSEHOLD' && (intent === 'NORMAL' || intent === 'EQUALLY') ? splitBetween : ['A', 'B', 'C'],
        paidFor: type === 'PERSONAL' ? paidFor || undefined : undefined,
        date,
        notes,
        timestamp: Date.now(),
        splitMode: type === 'HOUSEHOLD' ? (intent === 'EQUALLY' ? 'EQUAL' : splitMode) : undefined,
        customSplit: type === 'HOUSEHOLD' && (splitMode === 'PERCENTAGE' || splitMode === 'FIXED_AMOUNT') ? customSplit : undefined
      });

      navigate(type === 'PERSONAL' ? '/personal' : '/');
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to save expense. Please try again.');
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-800">New Expense</h2>
        <Link
          to="/bulk-add"
          className="flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors"
        >
          <ListPlus size={14} /> Bulk Mode
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Type Switcher */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setType('PERSONAL')}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${type === 'PERSONAL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            <UserIcon size={16} /> Personal
          </button>
          <button
            type="button"
            onClick={() => setType('HOUSEHOLD')}
            className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${type === 'HOUSEHOLD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            <Home size={16} /> Household
          </button>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Amount (₹)</label>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full text-4xl font-bold text-slate-800 bg-transparent border-b-2 border-slate-200 focus:border-slate-800 focus:outline-none pb-2 placeholder-slate-200"
            placeholder="0"
            autoFocus
          />
        </div>

        {/* Paid For - Only for Personal Expenses */}
        {type === 'PERSONAL' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Paid On Behalf Of (Optional)</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaidFor(null)}
                className={`p-3 rounded-xl text-xs font-medium transition-all ${paidFor === null
                  ? 'bg-slate-800 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                For Me
              </button>
              {USERS.filter(u => u.id !== currentUser).map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setPaidFor(user.id)}
                  className={`p-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${paidFor === user.id
                    ? user.avatarColor + ' text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${paidFor === user.id ? 'bg-white/20' : 'bg-slate-200'
                    }`}>
                    <span className={`text-xs font-bold ${paidFor === user.id ? 'text-white' : 'text-slate-600'
                      }`}>
                      {user.name[0]}
                    </span>
                  </div>
                  <span className="text-[10px]">{user.name}</span>
                </button>
              ))}
            </div>
            {paidFor && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                💰 IOU: {USERS.find(u => u.id === paidFor)?.name} owes you this amount
              </p>
            )}
          </div>
        )}

        {/* Intent and Split Management - Only for Household expenses */}
        {type === 'HOUSEHOLD' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Intent</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setIntent('NORMAL')}
                className={`p-3 rounded-xl font-medium text-xs transition-all ${intent === 'NORMAL'
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Salary Split
              </button>
              <button
                type="button"
                onClick={() => setIntent('EQUALLY')}
                className={`p-3 rounded-xl font-medium text-xs transition-all ${intent === 'EQUALLY'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Equal Split
              </button>
              <button
                type="button"
                onClick={() => setIntent('HELPING')}
                className={`p-3 rounded-xl font-medium text-xs transition-all ${intent === 'HELPING'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Helping (Gift)
              </button>
            </div>

            {/* Info message based on selected intent */}
            {intent === 'HELPING' && (
              <div className="mt-2 text-xs bg-purple-50 text-purple-700 p-2 rounded-lg flex items-start gap-2">
                <span className="text-purple-600">🎁</span>
                <p>You pay this fully as a gift. It won't be split. Great for treating the family!</p>
              </div>
            )}
            {intent === 'EQUALLY' && (
              <div className="mt-2 text-xs bg-blue-50 text-blue-700 p-2 rounded-lg flex items-start gap-2">
                <span className="text-blue-600">⚖️</span>
                <p>Amount will be split equally among selected people, regardless of salary.</p>
              </div>
            )}

            {/* Split Editor - For NORMAL intent with custom split modes */}
            {intent === 'NORMAL' && parseFloat(amount) > 0 && (
              <div className="mt-4">
                <SplitEditor
                  amount={parseFloat(amount)}
                  splitMode={splitMode}
                  customSplit={customSplit}
                  splitBetween={splitBetween}
                  onSplitModeChange={setSplitMode}
                  onCustomSplitChange={setCustomSplit}
                  onSplitBetweenChange={setSplitBetween}
                />
              </div>
            )}

            {/* Person Selection for EQUALLY intent */}
            {intent === 'EQUALLY' && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">Split Between</label>
                <div className="grid grid-cols-3 gap-2">
                  {USERS.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleSplitPerson(user.id)}
                      className={`p-3 rounded-xl font-medium text-sm transition-all flex flex-col items-center gap-1 ${splitBetween.includes(user.id)
                        ? user.avatarColor + ' text-white shadow-lg'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${splitBetween.includes(user.id) ? 'bg-white/20' : 'bg-slate-200'
                          }`}
                      >
                        <span
                          className={`text-xs font-bold ${splitBetween.includes(user.id) ? 'text-white' : 'text-slate-600'
                            }`}
                        >
                          {user.name[0]}
                        </span>
                      </div>
                      <span className="text-xs">{user.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {splitBetween.length === 3 ? '✓ Everyone included' : `Split among ${splitBetween.length} ${splitBetween.length === 1 ? 'person' : 'people'}`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === cat
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Note (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm"
              placeholder="What was it?"
            />
          </div>
        </div>

        <Button type="submit" fullWidth>
          Save {type === 'HOUSEHOLD' ? 'Shared' : 'Personal'} Expense
        </Button>
      </form>
    </div>
  );
};