export const formatCurrency = (amount: string): string => {
  const num = parseFloat(amount);
  return `$${num.toLocaleString('en-US')}`;
}

export const formatCurrency2 = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export const getYearDiff = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365))
}