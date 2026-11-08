export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '৳০';
  }
  return `৳${Math.round(amount).toLocaleString('en-IN')}`;
}

export default formatCurrency;

