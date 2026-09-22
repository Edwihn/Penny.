const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Calendar dates stay in UTC during calculations to avoid timezone/DST shifts.
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('Date must use YYYY-MM-DD.');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || Number(value.slice(0, 4)) < 1900) {
    throw new Error('Enter a real calendar date from year 1900 onward.');
  }
  return date;
}

export function dateISO(date) { return date.toISOString().slice(0, 10); }

export function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function formatExpenseDate(value) {
  const date = parseDate(value);
  return `${String(date.getUTCDate()).padStart(2, '0')}/${MONTHS[date.getUTCMonth()]}/${String(date.getUTCFullYear()).slice(-2)} ${DAYS[date.getUTCDay()]}`;
}

export function weekFor(value) {
  const date = parseDate(value);
  const monday = addDays(date, -((date.getUTCDay() + 6) % 7));
  return { start: dateISO(monday), end: dateISO(addDays(monday, 6)) };
}
