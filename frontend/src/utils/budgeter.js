export const calculatePercentage = (value, total, decimals = 0) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return percentage.toFixed(decimals);
};

export const calculateRemaining = (total, paid) =>
  Math.max(0, total - paid);

export const formatBudgetAmount = (amount) =>
  amount.toLocaleString();
