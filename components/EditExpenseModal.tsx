import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Expense, ExpenseType, ExpenseIntent, BrotherId } from '../types';
import { USERS, EXPENSE_CATEGORIES } from '../constants';
import { Button } from './ui/Button';

interface EditExpenseModalProps {
    expense: Expense;
    currentUser: BrotherId;
    onClose: () => void;
    onSave: (updates: Partial<Expense>) => Promise<void>;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
    expense,
    currentUser,
    onClose,
    onSave
}) => {
    const [amount, setAmount] = useState(expense.amount.toString());
    const [category, setCategory] = useState(expense.category);
    const [type, setType] = useState<ExpenseType>(expense.type);
    const [intent, setIntent] = useState<ExpenseIntent>(expense.intent);
    const [splitBetween, setSplitBetween] = useState<BrotherId[]>(expense.splitBetween);
    const [paidFor, setPaidFor] = useState<BrotherId | ''>(expense.paidFor || '');
    const [date, setDate] = useState(expense.date);
    const [notes, setNotes] = useState(expense.notes);
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const updates: Partial<Expense> = {
                amount: parseFloat(amount),
                category: category as any,
                type,
                intent,
                splitBetween,
                paidFor: paidFor || undefined,
                date,
                notes
            };

            await onSave(updates);
            onClose();
        } catch (error) {
            console.error('Error saving expense:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleSplit = (userId: BrotherId) => {
        if (splitBetween.includes(userId)) {
            setSplitBetween(splitBetween.filter(id => id !== userId));
        } else {
            setSplitBetween([...splitBetween, userId]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">Edit Expense</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Amount
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                            required
                        >
                            {EXPENSE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('HOUSEHOLD')}
                                className={`py-3 px-4 rounded-xl font-medium transition-all ${type === 'HOUSEHOLD'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                🏠 Household
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('PERSONAL')}
                                className={`py-3 px-4 rounded-xl font-medium transition-all ${type === 'PERSONAL'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                👤 Personal
                            </button>
                        </div>
                    </div>

                    {/* Intent (only for HOUSEHOLD) */}
                    {type === 'HOUSEHOLD' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Intent
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['NORMAL', 'HELPING', 'LOAN'] as ExpenseIntent[]).map(i => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setIntent(i)}
                                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${intent === i
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {i === 'NORMAL' ? '📊 Split' : i === 'HELPING' ? '🎁 Gift' : '💰 Loan'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Split Between (only for HOUSEHOLD NORMAL) */}
                    {type === 'HOUSEHOLD' && intent === 'NORMAL' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Split Between
                            </label>
                            <div className="flex gap-2">
                                {USERS.map(user => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => toggleSplit(user.id)}
                                        className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${splitBetween.includes(user.id)
                                                ? `${user.avatarColor} text-white`
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {user.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paid For (IOU) */}
                    {type === 'PERSONAL' && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Paid For (Optional - for IOUs)
                            </label>
                            <select
                                value={paidFor}
                                onChange={(e) => setPaidFor(e.target.value as BrotherId | '')}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                            >
                                <option value="">-- Myself --</option>
                                {USERS.filter(u => u.id !== currentUser).map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                            required
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                            rows={3}
                            placeholder="Add notes..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            disabled={saving}
                            className="flex-1"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
