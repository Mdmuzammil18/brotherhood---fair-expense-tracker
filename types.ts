export type BrotherId = 'A' | 'B' | 'C';

export interface User {
  id: BrotherId;
  name: string;
  avatarColor: string;
  email: string; // Added for Supabase mapping
}

export type ExpenseType = 'PERSONAL' | 'HOUSEHOLD';
export type ExpenseIntent = 'NORMAL' | 'HELPING' | 'LOAN' | 'EQUALLY';
export type ExpenseCategory = 'Rent' | 'Groceries' | 'Utilities' | 'Internet' | 'Misc' | 'Fun' | 'Travel' | 'Medical';

// Custom split types
export type SplitMode = 'EQUAL' | 'SALARY_RATIO' | 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface CustomSplit {
  [key: string]: number; // BrotherId -> percentage (0-100) or amount
}

export interface Expense {
  id: string;
  amount: number;
  type: ExpenseType;
  paidBy: BrotherId;
  category: ExpenseCategory;
  intent: ExpenseIntent; // Only relevant for HOUSEHOLD
  splitBetween: BrotherId[]; // Who should this expense be split among
  paidFor?: BrotherId; // Optional: If paying on behalf of another brother (creates IOU)
  date: string; // ISO string YYYY-MM-DD
  notes: string;
  timestamp: number;
  splitMode?: SplitMode; // How to split the expense
  customSplit?: CustomSplit; // Custom percentages or amounts per person
}

export interface MonthlySalary {
  month: string; // YYYY-MM
  salaries: Record<BrotherId, number>;
  isLocked: boolean;
}

export interface SettlementTransaction {
  from: BrotherId;
  to: BrotherId;
  amount: number;
}

export interface MonthlySettlement {
  month: string;
  totalExpense: number;
  salaries: Record<BrotherId, number>;
  shares: Record<BrotherId, number>;
  paid: Record<BrotherId, number>;
  balances: Record<BrotherId, number>;
  transactions: SettlementTransaction[];
}

export interface RecurringExpense {
  id: string;
  amount: number;
  type: ExpenseType;
  paidBy: BrotherId;
  category: ExpenseCategory;
  intent: ExpenseIntent;
  splitBetween: BrotherId[];
  paidFor?: BrotherId;
  notes: string;
  isActive: boolean;
}

export type AssetType = 'Cash' | 'Savings Account' | 'Investment' | 'Property' | 'Vehicle' | 'Jewelry' | 'Other';

export interface Asset {
  id: string;
  userId: BrotherId;
  name: string;
  type: AssetType;
  value: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type LiabilityType = 'Credit Card' | 'Personal Loan' | 'Home Loan' | 'Car Loan' | 'Student Loan' | 'Other';

export interface Liability {
  id: string;
  userId: BrotherId;
  name: string;
  type: LiabilityType;
  amount: number;
  interestRate?: number;
  emiAmount?: number;
  dueDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: BrotherId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyFinancialSummary {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  personalExpenses: number;
  householdExpenses: number;
}

// Budget types
export type BudgetType = 'MONTHLY' | 'CATEGORY' | 'PERSONAL';
export type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface Budget {
  id: string;
  userId: BrotherId | 'ALL'; // 'ALL' for household budgets
  type: BudgetType;
  category?: ExpenseCategory; // For category budgets
  amount: number;
  period: BudgetPeriod;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // Optional end date
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFinancialProfile {
  userId: BrotherId;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  assets: Asset[];
  liabilities: Liability[];
  savingsGoals: SavingsGoal[];
  monthlyHistory: MonthlyFinancialSummary[];
}