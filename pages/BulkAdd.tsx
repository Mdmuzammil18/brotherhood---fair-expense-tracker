import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrotherId, ExpenseCategory, ExpenseType, Expense, ExpenseIntent } from '../types';
import { EXPENSE_CATEGORIES, USERS } from '../constants';
import { dataService } from '../services/dataService';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, Home, User, Save, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../utils/money';

interface BulkAddProps {
    currentUser: BrotherId;
}

interface DraftExpense {
    id: string;
    amount: string;
    category: ExpenseCategory;
    type: ExpenseType;
    intent: ExpenseIntent;
    splitBetween: BrotherId[];
    notes: string;
}

export const BulkAdd: React.FC<BulkAddProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [drafts, setDrafts] = useState<DraftExpense[]>([
        { id: Math.random().toString(), amount: '', category: 'Groceries', type: 'HOUSEHOLD', intent: 'NORMAL', splitBetween: ['A', 'B', 'C'], notes: '' }
    ]);
    const [isSaving, setIsSaving] = useState(false);

    const addRow = () => {
        setDrafts([...drafts, { id: Math.random().toString(), amount: '', category: 'Groceries', type: 'HOUSEHOLD', intent: 'NORMAL', splitBetween: ['A', 'B', 'C'], notes: '' }]);
    };

    const removeRow = (id: string) => {
        if (drafts.length === 1) return;
        setDrafts(drafts.filter(d => d.id !== id));
    };

    const updateRow = (id: string, field: keyof DraftExpense, value: any) => {
        setDrafts(drafts.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const toggleParticipant = (draftId: string, brotherId: BrotherId) => {
        setDrafts(drafts.map(d => {
            if (d.id !== draftId) return d;
            const newSplit = d.splitBetween.includes(brotherId)
                ? d.splitBetween.filter(id => id !== brotherId)
                : [...d.splitBetween, brotherId];
            // Ensure at least one person is selected
            if (newSplit.length === 0) return d;
            return { ...d, splitBetween: newSplit };
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validDrafts = drafts.filter(d => parseFloat(d.amount) > 0);
        if (validDrafts.length === 0) {
            alert('Please enter at least one valid expense amount');
            return;
        }

        setIsSaving(true);
        try {
            const expensesToSave: Expense[] = validDrafts.map(d => ({
                id: Date.now() + Math.random().toString(),
                amount: parseFloat(d.amount),
                category: d.category,
                type: d.type,
                paidBy: currentUser,
                intent: d.type === 'PERSONAL' ? 'NORMAL' : d.intent,
                splitBetween: d.type === 'PERSONAL' ? [currentUser] : d.splitBetween,
                date,
                notes: d.notes,
                timestamp: Date.now()
            }));

            await dataService.bulkAddExpenses(expensesToSave);
            navigate('/');
        } catch (error) {
            console.error('Failed to bulk add expenses:', error);
            alert('Failed to save expenses. Please check your connection.');
        } finally {
            setIsSaving(false);
        }
    };

    const totalAmount = drafts.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    return (
        <div className="animate-fade-in pb-20 max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold text-slate-800">Bulk Add Expenses</h2>
                <div className="w-8" />
            </div>

            <div className="bg-slate-800 rounded-2xl p-5 mb-6 text-white shadow-xl">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Batch Date</p>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="bg-transparent border-none text-white font-bold focus:ring-0 p-0 text-lg"
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Batch</p>
                        <p className="text-2xl font-black text-emerald-400">{formatCurrency(totalAmount)}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {drafts.map((draft, index) => (
                    <div key={draft.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                        {drafts.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeRow(draft.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}

                        <div className="grid grid-cols-12 gap-3 items-center">
                            {/* Amount */}
                            <div className="col-span-5">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder="0.00"
                                    value={draft.amount}
                                    onChange={e => updateRow(draft.id, 'amount', e.target.value)}
                                    className="w-full text-xl font-bold text-slate-800 border-none p-0 focus:ring-0 placeholder-slate-200"
                                    required
                                />
                            </div>

                            {/* Type Toggle */}
                            <div className="col-span-7 flex justify-end">
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => updateRow(draft.id, 'type', 'HOUSEHOLD')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${draft.type === 'HOUSEHOLD' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        <Home size={10} className="inline mr-1" /> HOUSE
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateRow(draft.id, 'type', 'PERSONAL')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${draft.type === 'PERSONAL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        <User size={10} className="inline mr-1" /> SELF
                                    </button>
                                </div>
                                {draft.type === 'HOUSEHOLD' && (
                                    <div className="flex bg-slate-50 p-1 rounded-lg mt-2">
                                        <button
                                            type="button"
                                            onClick={() => updateRow(draft.id, 'intent', 'NORMAL')}
                                            className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${draft.intent === 'NORMAL' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}
                                        >
                                            STANDARD
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateRow(draft.id, 'intent', 'HELPING')}
                                            className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${draft.intent === 'HELPING' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400'}`}
                                        >
                                            GIFT
                                        </button>
                                    </div>
                                )}

                                {draft.type === 'HOUSEHOLD' && (
                                    <div className="flex gap-1 mt-2">
                                        {(['A', 'B', 'C'] as BrotherId[]).map(id => (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() => toggleParticipant(draft.id, id)}
                                                className={`w-6 h-6 rounded-full text-[8px] font-black transition-all ${draft.splitBetween.includes(id)
                                                    ? 'bg-slate-800 text-white'
                                                    : 'bg-slate-100 text-slate-300'
                                                    }`}
                                            >
                                                {id}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Category */}
                            <div className="col-span-12">
                                <select
                                    value={draft.category}
                                    onChange={e => updateRow(draft.id, 'category', e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-lg py-2 px-3 text-xs font-medium text-slate-600 focus:ring-2 focus:ring-slate-200"
                                >
                                    {EXPENSE_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="col-span-12">
                                <input
                                    type="text"
                                    placeholder="Note (optional)"
                                    value={draft.notes}
                                    onChange={e => updateRow(draft.id, 'notes', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-[10px] text-slate-400 focus:ring-0 placeholder-slate-200 italic"
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addRow}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                >
                    <Plus size={18} /> Add Another Row
                </button>

                <div className="pt-4 sticky bottom-6">
                    <Button type="submit" fullWidth disabled={isSaving}>
                        {isSaving ? (
                            <span className="flex items-center gap-2">Saving...</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Save size={18} /> Save All {drafts.filter(d => parseFloat(d.amount) > 0).length} Expenses
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
