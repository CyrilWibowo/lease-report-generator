export const formatCurrency = (amount: string): string => {
  const num = parseFloat(amount);
  return `$${num.toLocaleString('en-US')}`;
}