import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { BrotherId, Asset, Liability, SavingsGoal } from '../types';
import { dataService } from '../services/dataService';
import { CURRENT_MONTH, USERS } from '../constants';
import { formatCurrency } from '../utils/money';
import {
    TrendingUp, TrendingDown, Wallet, PiggyBank, Home, CreditCard, Target, Plus,
    Edit2, Trash2, DollarSign, BarChart3, ArrowUpCircle, ArrowDownCircle, RefreshCcw
} from 'lucide-react';

interface UserProfileProps {
    currentUser: BrotherId;
}

export const UserProfile: React.FC<UserProfileProps> = ({ currentUser }) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [monthlyHistory, setMonthlyHistory] = useState<any[]>([]);
    const [showAddAsset, setShowAddAsset] = useState(false);
    const [showAddLiability, setShowAddLiability] = useState(false);
    const [showAddGoal, setShowAddGoal] = useState(false);

    // Financial Summary
    const [netWorth, setNetWorth] = useState(0);
    const [totalAssets, setTotalAssets] = useState(0);
    const [totalLiabilities, setTotalLiabilities] = useState(0);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [monthlyExpenses, setMonthlyExpenses] = useState(0);
    const [monthlySavings, setMonthlySavings] = useState(0);

    const user = USERS.find(u => u.id === currentUser);

    const loadData = async () => {
        try {
            // Load assets, liabilities, and savings goals
            const [assetData, liabilityData, goalsData] = await Promise.all([
                dataService.getAssets(currentUser),
                dataService.getLiabilities(currentUser),
                dataService.getSavingsGoals(currentUser)
            ]);

            setAssets(assetData);
            setLiabilities(liabilityData);
            setSavingsGoals(goalsData);

            // Calculate totals
            const assetsTotal = assetData.reduce((sum: number, a: Asset) => sum + a.value, 0);
            const liabilitiesTotal = liabilityData.reduce((sum: number, l: Liability) => sum + l.amount, 0);
            setTotalAssets(assetsTotal);
            setTotalLiabilities(liabilitiesTotal);

            // Get expenses for current month
            const expenses = await dataService.getExpenses();
            const currentMonthExpenses = expenses.filter(e =>
                e.paidBy === currentUser &&
                e.date.startsWith(CURRENT_MONTH) &&
                !e.paidFor
            );
            const expensesTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
            setMonthlyExpenses(expensesTotal);

            // Get salary for current month
            const salaryData = await dataService.getSalaryForMonth(CURRENT_MONTH);
            const income = salaryData.salaries[currentUser] || 0;
            setMonthlyIncome(income);

            // Calculate savings and net worth
            const savings = income - expensesTotal;
            setMonthlySavings(savings);
            setNetWorth(assetsTotal - liabilitiesTotal);

            // Build monthly history (last 6 months)
            const history = await buildMonthlyHistory();
            setMonthlyHistory(history);
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    };

    const buildMonthlyHistory = async () => {
        const history = [];
        const expenses = await dataService.getExpenses();
        const salaries = await dataService.getSalaries();

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toISOString().slice(0, 7);

            const monthExpenses = expenses.filter(e =>
                e.paidBy === currentUser &&
                e.date.startsWith(month) &&
                !e.paidFor
            );
            const expensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

            const salaryData = salaries.find(s => s.month === month);
            const income = salaryData?.salaries[currentUser] || 0;

            history.push({
                month: date.toLocaleDateString('en-US', { month: 'short' }),
                income,
                expenses: expensesTotal,
                savings: income - expensesTotal
            });
        }

        return history;
    };

    useEffect(() => {
        loadData();
    }, [currentUser]);

    // Add Asset Form
    const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const newAsset: Asset = {
            id: `asset_${Date.now()}`,
            userId: currentUser,
            name: formData.get('name') as string,
            type: formData.get('type') as any,
            value: Number(formData.get('value')),
            notes: formData.get('notes') as string || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await dataService.addAsset(newAsset);
        setShowAddAsset(false);
        form.reset();
        loadData();
    };

    // Add Liability Form
    const handleAddLiability = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const newLiability: Liability = {
            id: `liability_${Date.now()}`,
            userId: currentUser,
            name: formData.get('name') as string,
            type: formData.get('type') as any,
            amount: Number(formData.get('amount')),
            interestRate: Number(formData.get('interestRate')) || undefined,
            emiAmount: Number(formData.get('emiAmount')) || undefined,
            notes: formData.get('notes') as string || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await dataService.addLiability(newLiability);
        setShowAddLiability(false);
        form.reset();
        loadData();
    };

    // Add Savings Goal Form
    const handleAddGoal = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const newGoal: SavingsGoal = {
            id: `goal_${Date.now()}`,
            userId: currentUser,
            name: formData.get('name') as string,
            targetAmount: Number(formData.get('targetAmount')),
            currentAmount: Number(formData.get('currentAmount')),
            targetDate: formData.get('targetDate') as string || undefined,
            notes: formData.get('notes') as string || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await dataService.addSavingsGoal(newGoal);
        setShowAddGoal(false);
        form.reset();
        loadData();
    };

    const handleDeleteAsset = async (id: string) => {
        if (confirm('Delete this asset?')) {
            await dataService.deleteAsset(currentUser, id);
            loadData();
        }
    };

    const handleDeleteLiability = async (id: string) => {
        if (confirm('Delete this liability?')) {
            await dataService.deleteLiability(currentUser, id);
            loadData();
        }
    };

    const handleDeleteGoal = async (id: string) => {
        if (confirm('Delete this goal?')) {
            await dataService.deleteSavingsGoal(currentUser, id);
            loadData();
        }
    };

    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header - User Profile Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-16 h-16 rounded-full ${user?.avatarColor} flex items-center justify-center text-2xl font-bold shadow-lg`}>
                        {user?.name[0]}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{user?.name}</h2>
                        <p className="text-emerald-100 text-sm">Financial Profile</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-400/30">
                    <div className="flex items-baseline gap-2">
                        <span className="text-emerald-100 text-sm">Net Worth</span>
                        <div className="flex-1"></div>
                        <span className="text-3xl font-bold">{formatCurrency(netWorth)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        {netWorth >= 0 ? (
                            <TrendingUp size={16} className="text-emerald-200" />
                        ) : (
                            <TrendingDown size={16} className="text-red-200" />
                        )}
                        <span className="text-xs text-emerald-100">
                            {netWorth >= 0 ? 'Positive' : 'Negative'} net worth
                        </span>
                    </div>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowUpCircle size={18} className="text-emerald-500" />
                        <span className="text-xs text-slate-500 font-medium">Income</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(monthlyIncome)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">This month</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowDownCircle size={18} className="text-red-500" />
                        <span className="text-xs text-slate-500 font-medium">Expenses</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(monthlyExpenses)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">This month</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <PiggyBank size={18} className="text-blue-500" />
                        <span className="text-xs text-slate-500 font-medium">Savings</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(monthlySavings)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">This month</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet size={18} className="text-purple-500" />
                        <span className="text-xs text-slate-500 font-medium">Assets</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(totalAssets)}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{assets.length} items</p>
                </div>
            </div>

            {/* Monthly Trends Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-emerald-500" />
                    6-Month Trend
                </h3>
                <div className="h-48">
                    {monthlyHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyHistory}>
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="savings" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            No historical data yet
                        </div>
                    )}
                </div>
                <div className="flex gap-4 mt-4 justify-center text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-slate-600">Expenses</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-slate-600">Savings</span>
                    </div>
                </div>
            </div>

            {/* Savings Goals */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Target size={18} className="text-blue-500" />
                        Savings Goals
                    </h3>
                    <button
                        onClick={() => setShowAddGoal(true)}
                        className="text-emerald-600 hover:text-emerald-700 p-1"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {showAddGoal && (
                    <form onSubmit={handleAddGoal} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                        <input
                            name="name"
                            placeholder="Goal name (e.g., Emergency Fund)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            required
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                name="targetAmount"
                                type="number"
                                placeholder="Target amount"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                required
                            />
                            <input
                                name="currentAmount"
                                type="number"
                                placeholder="Current amount"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                required
                            />
                        </div>
                        <input
                            name="targetDate"
                            type="date"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium">
                                Add Goal
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddGoal(false)}
                                className="px-4 bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {savingsGoals.length > 0 ? (
                    <div className="space-y-3">
                        {savingsGoals.map((goal) => {
                            const progress = (goal.currentAmount / goal.targetAmount) * 100;
                            return (
                                <div key={goal.id} className="p-3 bg-slate-50 rounded-lg">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{goal.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteGoal(goal.id)}
                                            className="text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 text-right">{progress.toFixed(1)}%</p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm text-center py-4">No savings goals yet</p>
                )}
            </div>

            {/* Assets Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Home size={18} className="text-emerald-500" />
                        Assets
                    </h3>
                    <button
                        onClick={() => setShowAddAsset(true)}
                        className="text-emerald-600 hover:text-emerald-700 p-1"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {showAddAsset && (
                    <form onSubmit={handleAddAsset} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                        <input
                            name="name"
                            placeholder="Asset name (e.g., Savings Account)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            required
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                name="type"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                required
                            >
                                <option value="">Select type</option>
                                <option value="Cash">Cash</option>
                                <option value="Savings Account">Savings Account</option>
                                <option value="Investment">Investment</option>
                                <option value="Property">Property</option>
                                <option value="Vehicle">Vehicle</option>
                                <option value="Jewelry">Jewelry</option>
                                <option value="Other">Other</option>
                            </select>
                            <input
                                name="value"
                                type="number"
                                placeholder="Value"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                required
                            />
                        </div>
                        <input
                            name="notes"
                            placeholder="Notes (optional)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium">
                                Add Asset
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddAsset(false)}
                                className="px-4 bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {assets.length > 0 ? (
                    <div className="space-y-2">
                        {assets.map((asset) => (
                            <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800 text-sm">{asset.name}</p>
                                    <p className="text-xs text-slate-500">{asset.type}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-emerald-600">{formatCurrency(asset.value)}</p>
                                    <button
                                        onClick={() => handleDeleteAsset(asset.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Total Assets</span>
                            <span className="text-lg font-bold text-emerald-600">{formatCurrency(totalAssets)}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm text-center py-4">No assets tracked yet</p>
                )}
            </div>

            {/* Liabilities Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={18} className="text-red-500" />
                        Liabilities
                    </h3>
                    <button
                        onClick={() => setShowAddLiability(true)}
                        className="text-emerald-600 hover:text-emerald-700 p-1"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {showAddLiability && (
                    <form onSubmit={handleAddLiability} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                        <input
                            name="name"
                            placeholder="Liability name (e.g., Car Loan)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            required
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                name="type"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                required
                            >
                                <option value="">Select type</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Personal Loan">Personal Loan</option>
                                <option value="Home Loan">Home Loan</option>
                                <option value="Car Loan">Car Loan</option>
                                <option value="Student Loan">Student Loan</option>
                                <option value="Other">Other</option>
                            </select>
                            <input
                                name="amount"
                                type="number"
                                placeholder="Amount"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                name="interestRate"
                                type="number"
                                step="0.1"
                                placeholder="Interest rate %"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            />
                            <input
                                name="emiAmount"
                                type="number"
                                placeholder="EMI amount"
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            />
                        </div>
                        <input
                            name="notes"
                            placeholder="Notes (optional)"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium">
                                Add Liability
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAddLiability(false)}
                                className="px-4 bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {liabilities.length > 0 ? (
                    <div className="space-y-2">
                        {liabilities.map((liability) => (
                            <div key={liability.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div className="flex-1">
                                    <p className="font-medium text-slate-800 text-sm">{liability.name}</p>
                                    <p className="text-xs text-slate-500">
                                        {liability.type}
                                        {liability.emiAmount && ` • EMI: ${formatCurrency(liability.emiAmount)}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-red-600">{formatCurrency(liability.amount)}</p>
                                    <button
                                        onClick={() => handleDeleteLiability(liability.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-600">Total Liabilities</span>
                            <span className="text-lg font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm text-center py-4">No liabilities tracked yet</p>
                )}
            </div>

            {/* Recurring Expenses Section */}
            <RecurringExpensesSection currentUser={currentUser} />
        </div>
    );
};

// Recurring Expenses Component
interface RecurringExpensesSectionProps {
    currentUser: BrotherId;
}

const RecurringExpensesSection: React.FC<RecurringExpensesSectionProps> = ({ currentUser }) => {
    const [recurring, setRecurring] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'HOUSEHOLD' | 'PERSONAL'>('HOUSEHOLD');
    const [paidBy, setPaidBy] = useState<BrotherId>(currentUser);
    const [category, setCategory] = useState<any>('Misc');
    const [intent, setIntent] = useState<any>('NORMAL');
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
                splitBetween: ['A', 'B', 'C'],
                paidFor: type === 'PERSONAL' && paidFor ? paidFor : undefined,
                notes,
                isActive: true
            });
            setIsAdding(false);
            setAmount('');
            setNotes('');
            loadData();
        } catch (error) {
            alert('Failed to add recurring expense');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this recurring expense?')) return;
        try {
            await dataService.deleteRecurringExpense(id);
            loadData();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const toggleActive = async (item: any) => {
        try {
            await dataService.updateRecurringExpense(item.id, { isActive: !item.isActive });
            loadData();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <RefreshCcw size={18} className="text-indigo-500" />
                    Recurring Expenses
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-emerald-600 hover:text-emerald-700 p-1"
                >
                    {isAdding ? <Plus className="rotate-45" size={20} /> : <Plus size={20} />}
                </button>
            </div>

            <div className="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs text-indigo-700">
                    <span className="font-semibold">💡 Monthly Automation:</span> Items here are automatically included in every monthly settlement.
                </p>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Monthly Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-3 pl-8 text-sm font-bold focus:outline-none focus:border-indigo-500"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Paid By</label>
                            <select
                                value={paidBy}
                                onChange={e => setPaidBy(e.target.value as BrotherId)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                            >
                                {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value="Misc">Misc</option>
                                <option value="Rent">Rent</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Internet">Internet</option>
                                <option value="Medical">Medical</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('HOUSEHOLD')}
                                className={`p-2 rounded-lg text-xs font-medium transition-all ${type === 'HOUSEHOLD' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}
                            >
                                🏠 Household
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('PERSONAL')}
                                className={`p-2 rounded-lg text-xs font-medium transition-all ${type === 'PERSONAL' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}
                            >
                                👤 Personal
                            </button>
                        </div>
                    </div>

                    {type === 'PERSONAL' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Paid For (IOU)</label>
                            <select
                                value={paidFor}
                                onChange={e => setPaidFor(e.target.value as BrotherId | '')}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-500"
                            >
                                <option value="">For Myself</option>
                                {USERS.filter(u => u.id !== paidBy).map(u => (
                                    <option key={u.id} value={u.id}>For {u.name} (IOU)</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Notes</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="e.g. Netflix, Rent..."
                        />
                    </div>

                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium">
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-4 bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <p className="text-center text-slate-400 text-sm py-4">Loading...</p>
            ) : recurring.length > 0 ? (
                <div className="space-y-2">
                    {recurring.map(item => (
                        <div key={item.id} className={`p-3 rounded-lg border transition-all ${item.isActive ? 'bg-white border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 text-sm">{formatCurrency(item.amount)}</span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${item.type === 'HOUSEHOLD' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {USERS.find(u => u.id === item.paidBy)?.name}
                                        {item.paidFor && ` → ${USERS.find(u => u.id === item.paidFor)?.name} (IOU)`}
                                        {item.notes && ` • ${item.notes}`}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => toggleActive(item)}
                                        className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${item.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}
                                    >
                                        {item.isActive ? 'ON' : 'OFF'}
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1 text-slate-300 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-400 text-sm text-center py-4">No recurring items yet</p>
            )}
        </div>
    );
};
