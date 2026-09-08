// Manual thousands-formatting rather than toLocaleString(...) with a locale tag - Hermes
// without the full-icu build ignores the locale argument and silently falls back to
// un-grouped digits, so a real LKR amount (routinely 4-6 figures) would render unreadable.
export function formatCurrency(amount: number): string {
  const [whole, fraction] = amount.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs. ${grouped}.${fraction}`;
}
