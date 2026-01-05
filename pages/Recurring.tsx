import React, { useEffect, useState } from 'react';
import { BrotherId, RecurringExpense, ExpenseType, ExpenseIntent, ExpenseCategory } from '../types';
import { dataService } from '../services/dataService';
import { USERS } from '../constants';
import { formatCurrency } from '../utils/money';
import { Button } from '../components/ui/Button';
import { RefreshCcw, Plus, Trash2, ShieldCheck, User } from 'lucide-react';

interface RecurringProps {
    currentUser: BrotherId;
}

export const Recurring: React.FC<RecurringProps> = ({ currentUser }) => {
    const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<ExpenseType>('HOUSEHOLD');
    const [paidBy, setPaidBy] = useState<BrotherId>(currentUser);
    const [category, setCategory] = useState<ExpenseCategory>('Misc');
    const [intent, setIntent] = useState<ExpenseIntent>('NORMAL');
    const [paidFor, setPaidFor] = useState<BrotherId | ''>('');
    const [notes, setNotes] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await dataService.getRecurringExpenses();
            setRecurring(data);
        } catch (error) {
            console.error('Error loading recurring expenses:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) return;

        try {
            await dataService.addRecurringExpense({
                amount: Number(amount),
                type,
                paidBy,
                category,
                intent,
                splitBetween: ['A', 'B', 'C'], // Default to everyone
                paidFor: type === 'PERSONAL' && paidFor ? paidFor : undefined,
                notes,
                isActive: true
            });
            setIsAdding(false);
            // Reset form
            setAmount('');
            setNotes('');
            loadData();
        } catch (error) {
            alert('Failed to add recurring expense');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this recurring expense? It will no longer appear in future settlements.')) return;
        try {
            await dataService.deleteRecurringExpense(id);
            loadData();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const toggleActive = async (item: RecurringExpense) => {
        try {
            await dataService.updateRecurringExpense(item.id, { isActive: !item.isActive });
            loadData();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                    <RefreshCcw size={20} />
                    <h2 className="text-lg font-bold">Monthly Automation</h2>
                </div>
                <p className="text-indigo-100 text-sm">
                    Items here are automatically added to <b>every</b> monthly settlement. Perfect for rent, insurance, or fixed IOUs.
                </p>
            </div>

            <button
                onClick={() => setIsAdding(!isAdding)}
                className={`w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${isAdding ? 'border-rose-300 text-rose-500 bg-rose-50' : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
            >
                {isAdding ? <Plus className="rotate-45" size={20} /> : <Plus size={20} />}
                <span className="font-bold">{isAdding ? 'Cancel' : 'Add Recurring Item'}</span>
            </button>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4 animate-slide-up">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Monthly Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 pl-10 text-lg font-bold focus:outline-none focus:border-indigo-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Paid By</label>
                            <select
                                value={paidBy}
                                onChange={e => setPaidBy(e.target.value as BrotherId)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                            >
                                {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value="Misc">Misc</option>
                                <option value="Rent">Rent</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Internet">Internet</option>
                                <option value="Medical">Medical</option>
                            </select>
                        </div>
                    </div>

                    {/* Type Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('HOUSEHOLD')}
                                className={`p-3 rounded-xl text-xs font-medium transition-all ${type === 'HOUSEHOLD'
                                        ? 'bg-indigo-500 text-white shadow-lg'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                🏠 Household
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('PERSONAL')}
                                className={`p-3 rounded-xl text-xs font-medium transition-all ${type === 'PERSONAL'
                                        ? 'bg-purple-500 text-white shadow-lg'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                👤 Personal
                            </button>
                        </div>
                    </div>

                    {/* Paid For - Only for Personal expenses */}
                    {type === 'PERSONAL' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Paid For (IOU)</label>
                            <select
                                value={paidFor}
                                onChange={e => setPaidFor(e.target.value as BrotherId | '')}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-purple-500"
                            >
                                <option value="">For Myself</option>
                                {USERS.filter(u => u.id !== paidBy).map(u => (
                                    <option key={u.id} value={u.id}>For {u.name} (IOU)</option>
                                ))}
                            </select>
                            {paidFor && (
                                <p className="text-xs text-amber-600 mt-2">
                                    💰 {USERS.find(u => u.id === paidFor)?.name} will owe you this amount every month
                                </p>
                            )}
                        </div>
                    )}

                    <div className={`${type === 'HOUSEHOLD' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'} p-2 rounded-lg text-xs flex items-center gap-2`}>
                        <span>ℹ️</span>
                        <p>
                            {type === 'HOUSEHOLD'
                                ? 'Will be split based on monthly salary ratios.'
                                : 'Will appear in your personal expenses every month.'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Notes (Optional)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. Jio Fiber, SIP Loan..."
                        />
                    </div>

                    <Button type="submit" fullWidth>Create Recurring Entry</Button>
                </form>
            )}

            {/* List */}
            <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm">Active Automations</h3>
                {loading ? (
                    <div className="py-10 text-center text-slate-400 text-sm">Loading...</div>
                ) : recurring.length > 0 ? (
                    recurring.map(item => (
                        <div key={item.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${item.isActive ? 'border-indigo-100' : 'border-slate-100 opacity-60'} transition-all`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800">{formatCurrency(item.amount)}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${item.type === 'HOUSEHOLD' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Paid by {USERS.find(u => u.id === item.paidBy)?.name}
                                        {item.paidFor && ` for ${USERS.find(u => u.id === item.paidFor)?.name}`}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleActive(item)} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${item.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                        {item.isActive ? 'Active' : 'Paused'}
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                    <RefreshCcw size={10} /> {item.category}
                                </span>
                                <span className="text-[10px] italic text-slate-400 truncate max-w-[150px]">
                                    {item.notes || 'No notes'}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-10 rounded-2xl text-center border-2 border-dashed border-slate-200">
                        <RefreshCcw size={32} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No recurring items yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
