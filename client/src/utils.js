export const money = cents => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
export function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export const shortDate = value => new Date(`${value}T00:00:00Z`).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', timeZone: 'UTC' });
export const weekday = value => new Date(`${value}T00:00:00Z`).toLocaleDateString('es-MX', { weekday: 'long', timeZone: 'UTC' });
export function moveWeek(value, offset) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset * 7);
  return date.toISOString().slice(0, 10);
}
