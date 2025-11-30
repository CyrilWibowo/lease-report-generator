export const formatCurrency = (amount: string): string => {
  const num = parseFloat(amount);
  return `$${num.toLocaleString('en-US')}`;
}
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}