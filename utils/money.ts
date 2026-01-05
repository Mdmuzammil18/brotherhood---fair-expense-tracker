export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getMonthLabel = (dateStr: string): string => {
  const date = new Date(dateStr + '-01');
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
