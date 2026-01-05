import React, { useEffect, useState, useMemo } from 'react';
import { BrotherId, Expense } from '../types';
import { dataService } from '../services/dataService';
import { USERS } from '../constants';
import { formatCurrency } from '../utils/money';
import { Trash2, Search, X, RotateCcw, Calendar } from 'lucide-react';

interface AllExpensesProps {
    currentUser: BrotherId;
}

export const AllExpenses: React.FC<AllExpensesProps> = ({ currentUser }) => {
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filterPerson, setFilterPerson] = useState<BrotherId | 'ALL'>('ALL');
    const [filterType, setFilterType] = useState<'ALL' | 'HOUSEHOLD' | 'PERSONAL'>('HOUSEHOLD');
    const [searchMonth, setSearchMonth] = useState<string>(''); // YYYY-MM
    const [searchQuery, setSearchQuery] = useState('');

    // Generate last 12 months for the scroller
    const availableMonths = useMemo(() => {
        const months = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.push({ label, value });
        }
        return months;
    }, []);

    useEffect(() => {
        loadExpenses();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [allExpenses, filterPerson, filterType, searchMonth, searchQuery]);

    const loadExpenses = async () => {
        try {
            const expenses = await dataService.getExpenses();
            setAllExpenses(expenses);
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (expense: Expense) => {
        if (expense.paidBy !== currentUser) {
            alert('You can only delete your own expenses');
            return;
        }

        if (!confirm(`Delete this ${formatCurrency(expense.amount)} ${expense.category} expense?`)) {
            return;
        }

        try {
            await dataService.deleteExpense(expense.id);
            await loadExpenses(); // Reload expenses
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense. Please try again.');
        }
    };

    const applyFilters = () => {
        let filtered = [...allExpenses];

        // Filter by person
        if (filterPerson !== 'ALL') {
            filtered = filtered.filter(e => e.paidBy === filterPerson);
        }

        // Filter by type
        if (filterType !== 'ALL') {
            filtered = filtered.filter(e => e.type === filterType);
        }

        // Filter by month
        if (searchMonth) {
            filtered = filtered.filter(e => e.date.startsWith(searchMonth));
        }

        // Filter by search query (notes or category)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.notes.toLowerCase().includes(q) ||
                e.category.toLowerCase().includes(q)
            );
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setFilteredExpenses(filtered);
    };

    const resetFilters = () => {
        setFilterPerson('ALL');
        setFilterType('HOUSEHOLD');
        setSearchMonth('');
        setSearchQuery('');
    };

    const isFilterActive = filterPerson !== 'ALL' || filterType !== 'HOUSEHOLD' || searchMonth !== '' || searchQuery !== '';

    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-24 animate-fade-in relative">
            {/* Header section (Non-sticky) */}
            <div className="px-1 flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">History</h2>
                    <p className="text-slate-500 text-sm">Review your transactions</p>
                </div>
                {isFilterActive && (
                    <button
                        onClick={resetFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-[10px] font-black text-rose-600 hover:bg-rose-100 transition-colors uppercase tracking-widest"
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                )}
            </div>

            {/* Sticky Filter Bar */}
            <div className="sticky top-14 z-30 -mx-4 px-4 py-4 bg-slate-50/95 backdrop-blur-md border-b border-slate-200 space-y-4">

                {/* IMPROVED CALENDAR - Horizontal Month Scroller */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        <Calendar size={12} />
                        Select Month
                    </div>
                    <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 -mx-2 px-2">
                        <button
                            onClick={() => setSearchMonth('')}
                            className={`px-5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${searchMonth === ''
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                }`}
                        >
                            All Time
                        </button>
                        {availableMonths.map(m => (
                            <button
                                key={m.value}
                                onClick={() => setSearchMonth(m.value)}
                                className={`px-5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${searchMonth === m.value
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-105'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                    }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sub-Filters: Type and Brother */}
                <div className="flex flex-col gap-3">
                    {/* Brother Toggles */}
                    <div className="flex overflow-x-auto no-scrollbar gap-2">
                        {USERS.map(user => (
                            <button
                                key={user.id}
                                onClick={() => setFilterPerson(filterPerson === user.id ? 'ALL' : user.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${filterPerson === user.id
                                        ? user.avatarColor + ' text-white border-transparent shadow-md scale-105'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                    }`}
                            >
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${filterPerson === user.id ? 'bg-white/20' : user.avatarColor + ' text-white'}`}>
                                    {user.id}
                                </div>
                                {user.name}
                            </button>
                        ))}
                        <div className="w-px h-6 bg-slate-200 shrink-0 self-center mx-1" />
                        {(['HOUSEHOLD', 'PERSONAL'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(filterType === type ? 'ALL' : type)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${filterType === type
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                    }`}
                            >
                                {type === 'HOUSEHOLD' ? '🏠 House' : '👤 Personal'}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar (Optional but useful for notes) */}
                    <div className="relative group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find by notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-10 text-xs shadow-sm focus:outline-none focus:border-slate-800 transition-all font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Summary & Total */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Impact</p>
                        <h3 className="text-3xl font-black tracking-tight">{formatCurrency(totalAmount)}</h3>
                    </div>
                    <div className="text-right">
                        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-500/20 inline-block mb-1">
                            {filteredExpenses.length} ENTRIES
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Matched Filters</p>
                    </div>
                </div>
            </div>

            {/* Expense List */}
            <div className="space-y-3 min-h-[40vh]">
                {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense, idx) => {
                        const user = USERS.find(u => u.id === expense.paidBy);
                        return (
                            <div
                                key={expense.id}
                                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group animate-slide-up"
                                style={{ animationDelay: `${idx * 40}ms` }}
                            >
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Category Initial Icon */}
                                        <div className={`w-12 h-12 rounded-2xl ${user?.avatarColor} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                                            <span className="text-lg font-black text-white">{expense.category[0]}</span>
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="font-bold text-slate-800 truncate">{expense.category}</h4>
                                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${expense.type === 'HOUSEHOLD' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                    }`}>
                                                    {expense.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-xs font-bold text-slate-700">{user?.name}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            {expense.notes && (
                                                <p className="text-[11px] text-slate-400 italic mt-1 truncate max-w-[180px]">"{expense.notes}"</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Amount & Actions */}
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <p className="text-xl font-black text-slate-800 tracking-tighter">{formatCurrency(expense.amount)}</p>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {expense.paidBy === currentUser && (
                                                <button
                                                    onClick={() => handleDelete(expense)}
                                                    className="p-1.5 rounded-xl bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                            <Calendar size={32} className="text-slate-200" />
                        </div>
                        <h3 className="text-slate-800 font-black">Empty Result</h3>
                        <p className="text-slate-400 text-xs mb-6 max-w-[200px] mx-auto font-medium">No transactions found for the selected period or filters.</p>
                        <button
                            onClick={resetFilters}
                            className="bg-slate-800 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-transform"
                        >
                            View All History
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
