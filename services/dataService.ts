import { Expense, MonthlySalary, BrotherId, RecurringExpense, Budget } from '../types';
import { supabase } from './supabase';

// Helper to convert database row to MonthlySalary
const dbRowToMonthlySalary = (row: any): MonthlySalary => ({
  month: row.month,
  salaries: {
    A: Number(row.salary_a),
    B: Number(row.salary_b),
    C: Number(row.salary_c)
  },
  isLocked: row.is_locked
});

// Helper to convert MonthlySalary to database row
const monthlySalaryToDbRow = (salary: MonthlySalary) => ({
  month: salary.month,
  salary_a: salary.salaries.A,
  salary_b: salary.salaries.B,
  salary_c: salary.salaries.C,
  is_locked: salary.isLocked
});

const dbRowToRecurringExpense = (row: any): RecurringExpense => ({
  id: row.id,
  amount: Number(row.amount),
  type: row.type,
  paidBy: row.paid_by,
  category: row.category,
  intent: row.intent,
  splitBetween: row.split_between || ['A', 'B', 'C'],
  paidFor: row.paid_for || undefined,
  notes: row.notes || '',
  isActive: row.is_active
});

export const dataService = {
  /**
   * Get all expenses from database
   */
  getExpenses: async (): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      amount: Number(row.amount),
      type: row.type,
      paidBy: row.paid_by,
      category: row.category,
      intent: row.intent,
      splitBetween: row.split_between || ['A', 'B', 'C'],
      paidFor: row.paid_for || undefined,
      date: row.date,
      notes: row.notes || '',
      timestamp: row.timestamp,
      splitMode: row.split_mode || 'SALARY_RATIO',
      customSplit: row.custom_split || undefined
    }));
  },

  /**
   * Delete an expense by ID
   */
  deleteExpense: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  },

  /**
   * Add multiple expenses to database in a single batch
   */
  bulkAddExpenses: async (expenses: Expense[]): Promise<void> => {
    const { error } = await supabase
      .from('expenses')
      .insert(expenses.map(expense => ({
        id: expense.id,
        amount: expense.amount,
        type: expense.type,
        paid_by: expense.paidBy,
        category: expense.category,
        intent: expense.intent,
        split_between: expense.splitBetween,
        paid_for: expense.paidFor,
        date: expense.date,
        notes: expense.notes,
        timestamp: expense.timestamp,
        split_mode: expense.splitMode || 'SALARY_RATIO',
        custom_split: expense.customSplit || null
      })));

    if (error) {
      console.error('Error bulk adding expenses:', error);
      throw new Error('Failed to add multiple expenses');
    }
  },

  /**
   * Add a new expense to database
   */
  addExpense: async (expense: Expense): Promise<void> => {
    const { error } = await supabase
      .from('expenses')
      .insert({
        id: expense.id,
        amount: expense.amount,
        type: expense.type,
        paid_by: expense.paidBy,
        category: expense.category,
        intent: expense.intent,
        split_between: expense.splitBetween,
        paid_for: expense.paidFor,
        date: expense.date,
        notes: expense.notes,
        timestamp: expense.timestamp,
        split_mode: expense.splitMode || 'SALARY_RATIO',
        custom_split: expense.customSplit || null
      });

    if (error) {
      console.error('Error adding expense:', error);
      throw new Error('Failed to add expense');
    }
  },

  /**
   * Update an existing expense
   */
  updateExpense: async (id: string, updates: Partial<Expense>): Promise<void> => {
    const dbUpdates: any = {};

    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.paidBy !== undefined) dbUpdates.paid_by = updates.paidBy;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.intent !== undefined) dbUpdates.intent = updates.intent;
    if (updates.splitBetween !== undefined) dbUpdates.split_between = updates.splitBetween;
    if (updates.paidFor !== undefined) dbUpdates.paid_for = updates.paidFor;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.splitMode !== undefined) dbUpdates.split_mode = updates.splitMode;
    if (updates.customSplit !== undefined) dbUpdates.custom_split = updates.customSplit;

    const { error } = await supabase
      .from('expenses')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  },

  /**
   * Get all monthly salaries from database
   */
  getSalaries: async (): Promise<MonthlySalary[]> => {
    const { data, error } = await supabase
      .from('monthly_salaries')
      .select('*')
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching salaries:', error);
      return [];
    }

    return (data || []).map(dbRowToMonthlySalary);
  },

  /**
   * Get salary for a specific month
   * If not found, carries forward from the most recent previous month
   */
  getSalaryForMonth: async (month: string): Promise<MonthlySalary> => {
    const { data, error } = await supabase
      .from('monthly_salaries')
      .select('*')
      .eq('month', month)
      .single();

    if (!error && data) {
      return dbRowToMonthlySalary(data);
    }

    // If no data for this month, find the most recent previous month
    const { data: previousMonths } = await supabase
      .from('monthly_salaries')
      .select('*')
      .lt('month', month) // Less than the requested month
      .order('month', { ascending: false })
      .limit(1);

    if (previousMonths && previousMonths.length > 0) {
      // Carry forward the previous month's salaries
      const previousSalary = dbRowToMonthlySalary(previousMonths[0]);
      return {
        month, // Use the requested month
        salaries: previousSalary.salaries, // Carry forward salaries
        isLocked: false // New month starts unlocked
      };
    }

    // No previous data exists, return default
    return {
      month,
      isLocked: false,
      salaries: { A: 0, B: 0, C: 0 }
    };
  },

  /**
   * Save (insert or update) monthly salary
   */
  saveSalary: async (salary: MonthlySalary): Promise<void> => {
    const dbRow = monthlySalaryToDbRow(salary);

    const { error } = await supabase
      .from('monthly_salaries')
      .upsert(dbRow, { onConflict: 'month' });

    if (error) {
      console.error('Error saving salary:', error);
      throw new Error('Failed to save salary');
    }
  },

  /**
   * Recurring Expenses Methods
   */
  getRecurringExpenses: async (): Promise<RecurringExpense[]> => {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recurring expenses:', error);
      return [];
    }

    return (data || []).map(dbRowToRecurringExpense);
  },

  addRecurringExpense: async (recurring: Omit<RecurringExpense, 'id'>): Promise<void> => {
    const { error } = await supabase
      .from('recurring_expenses')
      .insert({
        amount: recurring.amount,
        type: recurring.type,
        paid_by: recurring.paidBy,
        category: recurring.category,
        intent: recurring.intent,
        split_between: recurring.splitBetween,
        paid_for: recurring.paidFor,
        notes: recurring.notes,
        is_active: recurring.isActive
      });

    if (error) {
      console.error('Error adding recurring expense:', error);
      throw new Error('Failed to add recurring expense');
    }
  },

  updateRecurringExpense: async (id: string, updates: Partial<RecurringExpense>): Promise<void> => {
    const dbUpdates: any = {};
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.paidBy !== undefined) dbUpdates.paid_by = updates.paidBy;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.intent !== undefined) dbUpdates.intent = updates.intent;
    if (updates.splitBetween !== undefined) dbUpdates.split_between = updates.splitBetween;
    if (updates.paidFor !== undefined) dbUpdates.paid_for = updates.paidFor;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase
      .from('recurring_expenses')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating recurring expense:', error);
      throw new Error('Failed to update recurring expense');
    }
  },

  deleteRecurringExpense: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recurring expense:', error);
      throw new Error('Failed to delete recurring expense');
    }
  },

  /**
   * Assets Methods (storing in localStorage for now, can migrate to Supabase later)
   */
  getAssets: async (userId: BrotherId): Promise<any[]> => {
    const stored = localStorage.getItem(`assets_${userId}`);
    return stored ? JSON.parse(stored) : [];
  },

  addAsset: async (asset: any): Promise<void> => {
    const assets = await dataService.getAssets(asset.userId);
    assets.push(asset);
    localStorage.setItem(`assets_${asset.userId}`, JSON.stringify(assets));
  },

  updateAsset: async (userId: BrotherId, assetId: string, updates: any): Promise<void> => {
    const assets = await dataService.getAssets(userId);
    const index = assets.findIndex((a: any) => a.id === assetId);
    if (index !== -1) {
      assets[index] = { ...assets[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(`assets_${userId}`, JSON.stringify(assets));
    }
  },

  deleteAsset: async (userId: BrotherId, assetId: string): Promise<void> => {
    const assets = await dataService.getAssets(userId);
    const filtered = assets.filter((a: any) => a.id !== assetId);
    localStorage.setItem(`assets_${userId}`, JSON.stringify(filtered));
  },

  /**
   * Liabilities Methods
   */
  getLiabilities: async (userId: BrotherId): Promise<any[]> => {
    const stored = localStorage.getItem(`liabilities_${userId}`);
    return stored ? JSON.parse(stored) : [];
  },

  addLiability: async (liability: any): Promise<void> => {
    const liabilities = await dataService.getLiabilities(liability.userId);
    liabilities.push(liability);
    localStorage.setItem(`liabilities_${liability.userId}`, JSON.stringify(liabilities));
  },

  updateLiability: async (userId: BrotherId, liabilityId: string, updates: any): Promise<void> => {
    const liabilities = await dataService.getLiabilities(userId);
    const index = liabilities.findIndex((l: any) => l.id === liabilityId);
    if (index !== -1) {
      liabilities[index] = { ...liabilities[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(`liabilities_${userId}`, JSON.stringify(liabilities));
    }
  },

  deleteLiability: async (userId: BrotherId, liabilityId: string): Promise<void> => {
    const liabilities = await dataService.getLiabilities(userId);
    const filtered = liabilities.filter((l: any) => l.id !== liabilityId);
    localStorage.setItem(`liabilities_${userId}`, JSON.stringify(filtered));
  },

  /**
   * Savings Goals Methods
   */
  getSavingsGoals: async (userId: BrotherId): Promise<any[]> => {
    const stored = localStorage.getItem(`savings_goals_${userId}`);
    return stored ? JSON.parse(stored) : [];
  },

  addSavingsGoal: async (goal: any): Promise<void> => {
    const goals = await dataService.getSavingsGoals(goal.userId);
    goals.push(goal);
    localStorage.setItem(`savings_goals_${goal.userId}`, JSON.stringify(goals));
  },

  updateSavingsGoal: async (userId: BrotherId, goalId: string, updates: any): Promise<void> => {
    const goals = await dataService.getSavingsGoals(userId);
    const index = goals.findIndex((g: any) => g.id === goalId);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem(`savings_goals_${userId}`, JSON.stringify(goals));
    }
  },

  deleteSavingsGoal: async (userId: BrotherId, goalId: string): Promise<void> => {
    const goals = await dataService.getSavingsGoals(userId);
    const filtered = goals.filter((g: any) => g.id !== goalId);
    localStorage.setItem(`savings_goals_${userId}`, JSON.stringify(filtered));
  },

  /**
   * Budget Methods
   */
  getBudgets: async (userId: BrotherId): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.ALL`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      category: row.category || undefined,
      amount: Number(row.amount),
      period: row.period,
      startDate: row.start_date,
      endDate: row.end_date || undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  addBudget: async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    const { error } = await supabase
      .from('budgets')
      .insert({
        user_id: budget.userId,
        type: budget.type,
        category: budget.category || null,
        amount: budget.amount,
        period: budget.period,
        start_date: budget.startDate,
        end_date: budget.endDate || null,
        is_active: budget.isActive
      });

    if (error) {
      console.error('Error adding budget:', error);
      throw new Error('Failed to add budget');
    }
  },

  updateBudget: async (id: string, updates: Partial<Budget>): Promise<void> => {
    const dbUpdates: any = {};

    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.period !== undefined) dbUpdates.period = updates.period;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('budgets')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating budget:', error);
      throw new Error('Failed to update budget');
    }
  },

  deleteBudget: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting budget:', error);
      throw new Error('Failed to delete budget');
    }
  },

  getActiveBudgets: async (userId: BrotherId, month: string): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.ALL`)
      .eq('is_active', true)
      .lte('start_date', `${month}-31`) // Budget started before or during this month
      .or(`end_date.is.null,end_date.gte.${month}-01`); // No end date or ends during/after this month

    if (error) {
      console.error('Error fetching active budgets:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      category: row.category || undefined,
      amount: Number(row.amount),
      period: row.period,
      startDate: row.start_date,
      endDate: row.end_date || undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }
};