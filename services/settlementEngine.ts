import { Expense, MonthlySalary, MonthlySettlement, SettlementTransaction, BrotherId, RecurringExpense } from '../types';
import { USERS } from '../constants';

export const calculateSettlement = (
  month: string,
  expenses: Expense[],
  salaryData: MonthlySalary,
  recurringExpenses: RecurringExpense[] = []
): MonthlySettlement => {


  // 1. Filter Valid Expenses for Settlement
  // HOUSEHOLD expenses with 'NORMAL' or 'EQUALLY' intent
  const monthlyExpenses = expenses.filter(
    e => e.date.startsWith(month) && e.type === 'HOUSEHOLD' && (e.intent === 'NORMAL' || e.intent === 'EQUALLY')
  );


  // 2. Map Active Recurring Expenses (HOUSEHOLD & NORMAL/EQUALLY ONLY)
  const virtualExpenses: Expense[] = recurringExpenses
    .filter(re => re.isActive && re.type === 'HOUSEHOLD' && (re.intent === 'NORMAL' || re.intent === 'EQUALLY'))
    .map(re => ({
      id: `recurring-${re.id}`,
      amount: re.amount,
      type: re.type,
      paidBy: re.paidBy,
      category: re.category,
      intent: re.intent,
      splitBetween: re.splitBetween,
      paidFor: re.paidFor,
      date: `${month}-01`,
      notes: `[Recurring] ${re.notes}`,
      timestamp: Date.now()
    }));

  const relevantExpenses = [...monthlyExpenses, ...virtualExpenses];
  const totalExpense = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 2. Calculate Total Salary and Weights
  const salaries = salaryData.salaries;

  const shares: Record<BrotherId, number> = { A: 0, B: 0, C: 0 };
  const paid: Record<BrotherId, number> = { A: 0, B: 0, C: 0 };
  const balances: Record<BrotherId, number> = { A: 0, B: 0, C: 0 };

  // Calculate Shares based on split mode
  relevantExpenses.forEach(expense => {
    const splitPeople = expense.splitBetween || ['A', 'B', 'C'];
    const splitMode = expense.splitMode || 'SALARY_RATIO';

    if (splitMode === 'PERCENTAGE' && expense.customSplit) {
      // Custom percentage split
      splitPeople.forEach(id => {
        const percentage = expense.customSplit![id] || 0;
        shares[id] += expense.amount * (percentage / 100);
      });
    } else if (splitMode === 'FIXED_AMOUNT' && expense.customSplit) {
      // Custom fixed amount split
      splitPeople.forEach(id => {
        const amount = expense.customSplit![id] || 0;
        shares[id] += amount;
      });
    } else if (splitMode === 'EQUAL') {
      // Equal split
      const sharePerPerson = expense.amount / splitPeople.length;
      splitPeople.forEach(id => {
        shares[id] += sharePerPerson;
      });
    } else {
      // Default: SALARY_RATIO based split (backward compatible)
      const splitTotalSalary = splitPeople.reduce((sum, id) => sum + (salaries[id] || 0), 0);

      if (splitTotalSalary > 0) {
        const expensePercentage = expense.amount / splitTotalSalary;
        splitPeople.forEach(id => {
          const userSalary = salaries[id] || 0;
          shares[id] += userSalary * expensePercentage;
        });
      }
    }
  });

  // 3. Calculate Paid Amounts
  relevantExpenses.forEach(e => {
    if (paid[e.paidBy] !== undefined) {
      paid[e.paidBy] += e.amount;
    }
  });

  // 4. Calculate Net Balance
  USERS.forEach(user => {
    balances[user.id] = paid[user.id] - shares[user.id];
  });

  // 5. Minimize Transactions
  const transactions: SettlementTransaction[] = [];
  let debtors = USERS.map(u => ({ id: u.id, amount: balances[u.id] }))
    .filter(u => u.amount < -0.01)
    .sort((a, b) => a.amount - b.amount);

  let creditors = USERS.map(u => ({ id: u.id, amount: balances[u.id] }))
    .filter(u => u.amount > 0.01)
    .sort((a, b) => b.amount - a.amount);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Number(amount.toFixed(2))
    });

    debtor.amount += amount;
    creditor.amount -= amount;
    if (Math.abs(debtor.amount) < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return {
    month,
    totalExpense,
    salaries,
    shares,
    paid,
    balances,
    transactions
  };
};
