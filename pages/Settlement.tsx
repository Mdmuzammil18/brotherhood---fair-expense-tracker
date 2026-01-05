import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import { calculateSettlement } from '../services/settlementEngine';
import { MonthlySalary, MonthlySettlement, BrotherId } from '../types';
import { CURRENT_MONTH, USERS } from '../constants';
import { formatCurrency, getMonthLabel } from '../utils/money';
import { Button } from '../components/ui/Button';
import { Check, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

export const Settlement: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_MONTH);
  const [salaryData, setSalaryData] = useState<MonthlySalary | null>(null);
  const [settlement, setSettlement] = useState<MonthlySettlement | null>(null);
  const [editingSalaries, setEditingSalaries] = useState(false);
  const [tempSalaries, setTempSalaries] = useState<Record<string, number>>({});

  const fetchData = async (month: string) => {
    try {
      const sData = await dataService.getSalaryForMonth(month);
      const expenses = await dataService.getExpenses();
      const recurring = await dataService.getRecurringExpenses();
      const result = calculateSettlement(month, expenses, sData, recurring);
      setSalaryData(sData);
      setSettlement(result);
      setTempSalaries(sData.salaries);
    } catch (error) {
      console.error('Error loading settlement data:', error);
    }
  };

  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth]);

  const handleSalarySave = async () => {
    if (!salaryData) return;
    try {
      const newSalaryData = {
        ...salaryData,
        month: selectedMonth, // Ensure we save to the selected month
        salaries: {
          A: Number(tempSalaries['A']),
          B: Number(tempSalaries['B']),
          C: Number(tempSalaries['C']),
        }
      };
      await dataService.saveSalary(newSalaryData);
      setEditingSalaries(false);
      await fetchData(selectedMonth); // Recalculate
    } catch (error) {
      console.error('Error saving salary:', error);
      alert('Failed to save salaries. Please try again.');
    }
  };

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

  if (!settlement || !salaryData) {
    return (
      <div className="space-y-8 pb-10">
        {/* Skeleton for Salary Section */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200">
          <div className="skeleton h-6 w-40 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-8 h-8 rounded-full"></div>
                <div className="flex-1 skeleton h-10 rounded"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Skeleton for Month Selector */}
        <section className="bg-slate-700 rounded-2xl p-4">
          <div className="skeleton h-10 w-full rounded bg-slate-600"></div>
        </section>

        {/* Skeleton for Settlement */}
        <div className="bg-slate-800 rounded-2xl p-6 space-y-4">
          <div className="skeleton h-6 w-32 rounded bg-slate-700"></div>
          <div className="skeleton h-20 w-full rounded bg-slate-700"></div>
        </div>
      </div>
    );
  }

  const totalSalary = (Object.values(settlement.salaries) as number[]).reduce((a, b) => a + b, 0);
  const isSalaryMissing = totalSalary === 0;

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* 1. Salary Input Section */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800">Monthly Salaries for {getMonthLabel(selectedMonth)}</h3>
          {!salaryData.isLocked && (
            <button
              onClick={() => setEditingSalaries(!editingSalaries)}
              className="text-xs text-emerald-600 font-semibold"
            >
              {editingSalaries ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>

        {editingSalaries ? (
          <div className="space-y-3">
            {USERS.map(user => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{user.name[0]}</span>
                <input
                  type="number"
                  value={tempSalaries[user.id] || ''}
                  onChange={(e) => setTempSalaries({ ...tempSalaries, [user.id]: parseFloat(e.target.value) || 0 })}
                  className="flex-1 border border-slate-300 rounded-lg p-2 text-sm"
                  placeholder="Enter Salary"
                />
              </div>
            ))}
            <Button onClick={handleSalarySave} fullWidth className="mt-2">Update Calculations</Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {USERS.map(user => (
              <div key={user.id} className="bg-slate-50 p-2 rounded-lg text-center">
                <span className="text-[10px] text-slate-400 block">{user.name}</span>
                <span className="font-bold text-slate-700 text-sm">{formatCurrency(settlement.salaries[user.id])}</span>
              </div>
            ))}
          </div>
        )}

        {isSalaryMissing && !editingSalaries && (
          <div className="mt-3 flex items-start gap-2 text-rose-600 text-xs bg-rose-50 p-2 rounded">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <p>Please enter salaries to calculate fair shares. Currently defaulting to equal split.</p>
          </div>
        )}
      </section>

      {/* Month Selector */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ArrowRight size={20} className="rotate-180" />
          </button>

          <div className="text-center">
            <p className="text-white text-lg font-bold">{getMonthLabel(selectedMonth)}</p>
            <p className="text-slate-400 text-xs">Tap arrows to change month</p>
          </div>

          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* 2. Logic Explanation */}
      <section className="px-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">The Math</h4>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm">
          {USERS.map(user => (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                    {user.id}
                  </div>
                  <span className="font-bold text-slate-800 text-sm">{user.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{formatCurrency(settlement.shares[user.id])}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Requirement</p>
                </div>
              </div>
            </div>
          ))}
          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500">Total Household Spend</span>
            <span className="text-sm font-black text-slate-800">{formatCurrency(settlement.totalExpense)}</span>
          </div>
        </div>
      </section>

      {/* 3. Final Settlement Instructions */}
      <section className="bg-slate-800 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-4">
          <Check className="text-emerald-400" />
          <h2 className="text-lg font-bold">Settlement Plan</h2>
        </div>

        {settlement.transactions.length === 0 ? (
          <div className="text-center py-4 text-slate-400">
            <p>All settled up! No payments needed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {settlement.transactions.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-700/50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${USERS.find(u => u.id === t.from)?.avatarColor} flex items-center justify-center font-bold text-xs`}>
                    {USERS.find(u => u.id === t.from)?.name[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">PAY</span>
                    <span className="font-bold">{formatCurrency(t.amount)}</span>
                  </div>
                </div>
                <ArrowRight className="text-slate-500" />
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${USERS.find(u => u.id === t.to)?.avatarColor} flex items-center justify-center font-bold text-xs`}>
                    {USERS.find(u => u.id === t.to)?.name[0]}
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-400">TO</span>
                    <span className="font-bold text-emerald-400">{USERS.find(u => u.id === t.to)?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-700 flex justify-between items-center">
          <span className="text-xs text-slate-400">Month: {getMonthLabel(selectedMonth)}</span>
          {!salaryData.isLocked ? (
            <button className="flex items-center gap-1 text-xs text-slate-300 hover:text-white transition-colors">
              <Lock size={12} /> Lock Month
            </button>
          ) : (
            <span className="text-xs text-emerald-400 flex items-center gap-1"><Lock size={12} /> Locked</span>
          )}
        </div>
      </section>
    </div>
  );
};