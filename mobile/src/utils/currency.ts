// Manual thousands-formatting rather than toLocaleString(...) with a locale tag - Hermes
// without the full-icu build ignores the locale argument and silently falls back to
// un-grouped digits, so a real LKR amount (routinely 4-6 figures) would render unreadable.
export function formatCurrency(amount: number): string {
  const [whole, fraction] = amount.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs. ${grouped}.${fraction}`;
}

// Abbreviated form for tight spaces (e.g. a dashboard stat tile) - "Rs. 86k" rather than
// "Rs. 86,000.00". Only abbreviates at 1,000+; anything smaller renders in full.
export function formatCurrencyCompact(amount: number): string {
  if (amount < 1000) {
    return formatCurrency(amount);
  }
  const thousands = amount / 1000;
  const rounded = thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10;
  return `Rs. ${rounded}k`;
}
