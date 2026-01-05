import React, { useState, useEffect } from 'react';
import { BrotherId, SplitMode, CustomSplit } from '../types';
import { USERS } from '../constants';

interface SplitEditorProps {
    amount: number;
    splitMode: SplitMode;
    customSplit: CustomSplit;
    splitBetween: BrotherId[];
    onSplitModeChange: (mode: SplitMode) => void;
    onCustomSplitChange: (split: CustomSplit) => void;
    onSplitBetweenChange: (people: BrotherId[]) => void;
}

export const SplitEditor: React.FC<SplitEditorProps> = ({
    amount,
    splitMode,
    customSplit,
    splitBetween,
    onSplitModeChange,
    onCustomSplitChange,
    onSplitBetweenChange
}) => {
    const [validationError, setValidationError] = useState<string>('');

    // Validate custom splits whenever they change
    useEffect(() => {
        if (splitMode === 'PERCENTAGE') {
            const total = Object.values(customSplit).reduce((sum: number, val: number) => sum + val, 0);
            if (Math.abs(total - 100) > 0.01) {
                setValidationError(`Total must equal 100% (currently ${total.toFixed(1)}%)`);
            } else {
                setValidationError('');
            }
        } else if (splitMode === 'FIXED_AMOUNT') {
            const total = Object.values(customSplit).reduce((sum: number, val: number) => sum + val, 0);
            if (Math.abs(total - amount) > 0.01) {
                setValidationError(`Total must equal ₹${amount} (currently ₹${total.toFixed(2)})`);
            } else {
                setValidationError('');
            }
        } else {
            setValidationError('');
        }
    }, [splitMode, customSplit, amount]);

    const handlePercentageChange = (userId: BrotherId, value: string) => {
        const numValue = parseFloat(value) || 0;
        onCustomSplitChange({ ...customSplit, [userId]: numValue });
    };

    const handleAmountChange = (userId: BrotherId, value: string) => {
        const numValue = parseFloat(value) || 0;
        onCustomSplitChange({ ...customSplit, [userId]: numValue });
    };

    const toggleSplitPerson = (id: BrotherId) => {
        const newSplit = splitBetween.includes(id)
            ? splitBetween.filter(p => p !== id)
            : [...splitBetween, id];
        onSplitBetweenChange(newSplit);
    };

    const autoFillRemaining = (userId: BrotherId) => {
        const others = Object.keys(customSplit).filter(k => k !== userId);
        const othersTotal = others.reduce((sum: number, k: string) => sum + ((customSplit[k] as number) || 0), 0);

        if (splitMode === 'PERCENTAGE') {
            onCustomSplitChange({ ...customSplit, [userId]: 100 - othersTotal });
        } else if (splitMode === 'FIXED_AMOUNT') {
            onCustomSplitChange({ ...customSplit, [userId]: amount - othersTotal });
        }
    };

    return (
        <div className="space-y-4">
            {/* Split Mode Selector */}
            <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                    Split Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => onSplitModeChange('EQUAL')}
                        className={`p-3 rounded-xl font-medium text-xs transition-all ${splitMode === 'EQUAL'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Equal Split
                    </button>
                    <button
                        type="button"
                        onClick={() => onSplitModeChange('SALARY_RATIO')}
                        className={`p-3 rounded-xl font-medium text-xs transition-all ${splitMode === 'SALARY_RATIO'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Salary Ratio
                    </button>
                    <button
                        type="button"
                        onClick={() => onSplitModeChange('PERCENTAGE')}
                        className={`p-3 rounded-xl font-medium text-xs transition-all ${splitMode === 'PERCENTAGE'
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Custom %
                    </button>
                    <button
                        type="button"
                        onClick={() => onSplitModeChange('FIXED_AMOUNT')}
                        className={`p-3 rounded-xl font-medium text-xs transition-all ${splitMode === 'FIXED_AMOUNT'
                            ? 'bg-amber-500 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Custom Amounts
                    </button>
                </div>
            </div>

            {/* Split Between Selection - For modes that need it */}
            {(splitMode === 'EQUAL' || splitMode === 'SALARY_RATIO') && (
                <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                        Split Between
                    </label>
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
                </div>
            )}

            {/* Custom Percentage Inputs */}
            {splitMode === 'PERCENTAGE' && (
                <div className="bg-purple-50 p-4 rounded-2xl space-y-3">
                    <p className="text-xs font-semibold text-purple-900 uppercase">
                        Set Custom Percentages
                    </p>
                    {USERS.map(user => (
                        <div key={user.id} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center shrink-0`}>
                                <span className="text-xs font-bold text-white">{user.id}</span>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-slate-700">{user.name}</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={customSplit[user.id] || 0}
                                    onChange={e => handlePercentageChange(user.id, e.target.value)}
                                    className="w-20 px-3 py-2 border border-purple-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:border-purple-500"
                                />
                                <span className="text-sm font-bold text-purple-700">%</span>
                                <button
                                    type="button"
                                    onClick={() => autoFillRemaining(user.id)}
                                    className="text-xs px-2 py-1 bg-purple-200 text-purple-700 rounded hover:bg-purple-300 transition-colors"
                                    title="Auto-fill remaining"
                                >
                                    Auto
                                </button>
                            </div>
                        </div>
                    ))}
                    {amount > 0 && (
                        <div className="mt-3 pt-3 border-t border-purple-200 space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-purple-900">Preview:</span>
                            </div>
                            {USERS.map(user => {
                                const percentage = customSplit[user.id] || 0;
                                const userAmount = (amount * percentage) / 100;
                                return (
                                    <div key={user.id} className="flex justify-between text-xs">
                                        <span className="text-slate-600">{user.name}:</span>
                                        <span className="font-bold text-purple-900">₹{userAmount.toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Custom Amount Inputs */}
            {splitMode === 'FIXED_AMOUNT' && (
                <div className="bg-amber-50 p-4 rounded-2xl space-y-3">
                    <p className="text-xs font-semibold text-amber-900 uppercase">
                        Set Custom Amounts
                    </p>
                    {USERS.map(user => (
                        <div key={user.id} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center shrink-0`}>
                                <span className="text-xs font-bold text-white">{user.id}</span>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-slate-700">{user.name}</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-amber-700">₹</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={customSplit[user.id] || 0}
                                    onChange={e => handleAmountChange(user.id, e.target.value)}
                                    className="w-24 px-3 py-2 border border-amber-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:border-amber-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => autoFillRemaining(user.id)}
                                    className="text-xs px-2 py-1 bg-amber-200 text-amber-700 rounded hover:bg-amber-300 transition-colors"
                                    title="Auto-fill remaining"
                                >
                                    Auto
                                </button>
                            </div>
                        </div>
                    ))}
                    {amount > 0 && (
                        <div className="mt-3 pt-3 border-t border-amber-200">
                            <div className="flex justify-between text-xs">
                                <span className="font-medium text-amber-900">Allocated:</span>
                                <span className="font-bold text-amber-900">
                                    ₹{Object.values(customSplit).reduce((sum: number, val: number) => sum + val, 0).toFixed(2)} / ₹{amount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Validation Error */}
            {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium">
                    ⚠️ {validationError}
                </div>
            )}

            {/* Info Messages */}
            {splitMode === 'EQUAL' && (
                <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-xs flex items-start gap-2">
                    <span className="text-blue-600">ℹ️</span>
                    <p>Amount will be split equally among selected people.</p>
                </div>
            )}
            {splitMode === 'SALARY_RATIO' && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs flex items-start gap-2">
                    <span className="text-emerald-600">ℹ️</span>
                    <p>Amount will be split based on salary ratios among selected people.</p>
                </div>
            )}
        </div>
    );
};
