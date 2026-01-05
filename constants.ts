import { BrotherId, User, ExpenseCategory } from './types';

// NOTE: Ensure your Supabase users use these exact emails
export const USERS: User[] = [
  { id: 'A', name: 'Abrar', avatarColor: 'bg-blue-500', email: 'abrar.md27@gmail.com' },
  { id: 'B', name: 'Mujju', avatarColor: 'bg-emerald-500', email: 'md.muzammil18@gmail.com' },
  { id: 'C', name: 'Muddu', avatarColor: 'bg-purple-500', email: 'mudassir.blog@gmail.com' },
];

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Rent',
  'Utilities',
  'Internet',
  'Fun',
  'Medical',
  'Transport',
  'Credit Card',
  'Loan EMI',
  'Subscriptions',
  'Phone Bill',
  'Gym',
  'Petrol',
  'Insurance',
  'Shopping',
  'Food & Dining',
  'Lend to Friends/Family',
  'Misc'
] as const;

export const getUser = (id: BrotherId): User => USERS.find(u => u.id === id) || USERS[0];

export const CURRENT_MONTH = new Date().toISOString().slice(0, 7); // YYYY-MM