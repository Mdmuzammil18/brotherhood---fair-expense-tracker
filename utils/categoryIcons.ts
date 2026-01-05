import {
    ShoppingCart, Home, Zap, Wifi, PartyPopper, Heart, Car, CreditCard,
    Repeat, Smartphone, Dumbbell, Droplet, Shield, ShoppingBag, Utensils,
    Users, DollarSign
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, any> = {
    'Groceries': ShoppingCart,
    'Rent': Home,
    'Utilities': Zap,
    'Internet': Wifi,
    'Fun': PartyPopper,
    'Medical': Heart,
    'Transport': Car,
    'Credit Card': CreditCard,
    'Loan EMI': Repeat,
    'Subscriptions': Repeat,
    'Phone Bill': Smartphone,
    'Gym': Dumbbell,
    'Petrol': Droplet,
    'Insurance': Shield,
    'Shopping': ShoppingBag,
    'Food & Dining': Utensils,
    'Lend to Friends/Family': Users,
    'Misc': DollarSign
};

export const getCategoryIcon = (category: string) => {
    return CATEGORY_ICONS[category] || DollarSign;
};

export const CATEGORY_COLORS: Record<string, string> = {
    'Groceries': 'text-emerald-600 bg-emerald-50',
    'Rent': 'text-blue-600 bg-blue-50',
    'Utilities': 'text-yellow-600 bg-yellow-50',
    'Internet': 'text-purple-600 bg-purple-50',
    'Fun': 'text-pink-600 bg-pink-50',
    'Medical': 'text-red-600 bg-red-50',
    'Transport': 'text-indigo-600 bg-indigo-50',
    'Credit Card': 'text-orange-600 bg-orange-50',
    'Loan EMI': 'text-slate-600 bg-slate-50',
    'Subscriptions': 'text-violet-600 bg-violet-50',
    'Phone Bill': 'text-cyan-600 bg-cyan-50',
    'Gym': 'text-lime-600 bg-lime-50',
    'Petrol': 'text-amber-600 bg-amber-50',
    'Insurance': 'text-teal-600 bg-teal-50',
    'Shopping': 'text-fuchsia-600 bg-fuchsia-50',
    'Food & Dining': 'text-rose-600 bg-rose-50',
    'Lend to Friends/Family': 'text-sky-600 bg-sky-50',
    'Misc': 'text-gray-600 bg-gray-50'
};

export const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || 'text-gray-600 bg-gray-50';
};
