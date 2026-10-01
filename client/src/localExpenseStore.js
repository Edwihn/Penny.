import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DATABASE = 'penny';
const CATEGORIES = [
  { id: 'food', label: 'Comida y bebidas', color: '#eaaa43', keywords: ['coffee', 'lunch', 'dinner', 'breakfast', 'food', 'grocery', 'groceries', 'restaurant', 'cafe', 'café', 'pizza', 'comida', 'desayuno', 'almuerzo', 'cena', 'supermercado', 'mercado', 'despensa', 'restaurante'] },
  { id: 'transport', label: 'Transporte', color: '#689b8a', keywords: ['bus', 'uber', 'taxi', 'train', 'fuel', 'gas', 'metro', 'transport', 'parking', 'autobus', 'autobús', 'camion', 'camión', 'gasolina', 'transporte', 'estacionamiento'] },
  { id: 'shopping', label: 'Compras', color: '#9c8cbd', keywords: ['shop', 'shopping', 'clothes', 'shirt', 'shoes', 'clothing', 'tienda', 'ropa', 'compras', 'zapatos', 'cuaderno'] },
  { id: 'bills', label: 'Servicios y recibos', color: '#648fba', keywords: ['rent', 'internet', 'electricity', 'water', 'bill', 'phone', 'utilities', 'renta', 'luz', 'agua', 'recibo', 'telefono', 'teléfono', 'servicios'] },
  { id: 'entertainment', label: 'Entretenimiento', color: '#d67b68', keywords: ['movie', 'cinema', 'netflix', 'game', 'concert', 'spotify', 'cine', 'pelicula', 'película', 'juego', 'concierto', 'entretenimiento'] },
  { id: 'other', label: 'Otros', color: '#969c98', keywords: [] },
];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
let databasePromise;

async function database() {
  if (!databasePromise) databasePromise = (async () => {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const consistency = await sqlite.checkConnectionsConsistency();
    const connected = await sqlite.isConnection(DATABASE, false);
    const db = consistency.result && connected.result
      ? await sqlite.retrieveConnection(DATABASE, false)
      : await sqlite.createConnection(DATABASE, false, 'no-encryption', 1, false);
    if (!(await db.isDBOpen()).result) await db.open();
    await db.execute(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY NOT NULL,
      concept TEXT NOT NULL,
      amountCents INTEGER NOT NULL CHECK(amountCents BETWEEN 1 AND 100000000),
      date TEXT NOT NULL,
      formattedDate TEXT NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      categoryLabel TEXT NOT NULL,
      color TEXT NOT NULL,
      createdAt TEXT NOT NULL
    ); CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date, createdAt);`);
    return db;
  })().catch(error => { databasePromise = null; throw error; });
  return databasePromise;
}

function formatDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('La fecha debe tener el formato AAAA-MM-DD.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || Number(value.slice(0, 4)) < 1900) throw new Error('Escribe una fecha válida a partir del año 1900.');
  return `${String(date.getUTCDate()).padStart(2, '0')}/${MONTHS[date.getUTCMonth()]}/${String(date.getUTCFullYear()).slice(-2)} ${DAYS[date.getUTCDay()]}`;
}

function createExpense(input, existing) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Escribe los datos del gasto.');
  const { concept, amount, date, reason = '', category = 'auto' } = input;
  if (typeof concept !== 'string' || !concept.trim() || concept.trim().length > 100) throw new Error('El concepto debe tener entre 1 y 100 caracteres.');
  const amountText = typeof amount === 'number' || typeof amount === 'string' ? String(amount) : '';
  if (!/^\d+(\.\d{1,2})?$/.test(amountText)) throw new Error('El importe debe ser positivo y tener hasta dos decimales.');
  const amountCents = Math.round(Number(amountText) * 100);
  if (!Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 100000000) throw new Error('El importe debe estar entre 0.01 y 1,000,000.00.');
  if (typeof reason !== 'string' || reason.length > 500) throw new Error('La nota puede tener hasta 500 caracteres.');
  const selected = category === 'auto'
    ? CATEGORIES.find(item => item.keywords.some(word => concept.toLowerCase().split(/[^\p{L}\p{N}]+/u).includes(word))) ?? CATEGORIES.at(-1)
    : CATEGORIES.find(item => item.id === category);
  if (!selected) throw new Error('Elige una categoría válida o la detección automática.');
  return {
    id: existing?.id ?? crypto.randomUUID(), concept: concept.trim(), amountCents,
    date, formattedDate: formatDate(date), reason: reason.trim(), category: selected.id,
    categoryLabel: selected.label, color: selected.color, createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

function rowToExpense(row) {
  return { id: row.id, concept: row.concept, amountCents: row.amountCents, date: row.date, formattedDate: row.formattedDate, reason: row.reason, category: row.category, categoryLabel: row.categoryLabel, color: row.color, createdAt: row.createdAt };
}
async function allExpenses() {
  const result = await (await database()).query('SELECT * FROM expenses ORDER BY date DESC, createdAt DESC');
  return (result.values ?? []).map(rowToExpense);
}
async function insertExpense(expense, useTransaction = true) {
  await (await database()).run('INSERT INTO expenses (id, concept, amountCents, date, formattedDate, reason, category, categoryLabel, color, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', Object.values(expense), useTransaction);
  return expense;
}
function reportFor(expenses, value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Elige una fecha válida para el reporte.');
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const start = monday.toISOString().slice(0, 10);
  const endDate = new Date(monday);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  const end = endDate.toISOString().slice(0, 10);
  const weekly = expenses.filter(item => item.date >= start && item.date <= end);
  const days = Array.from({ length: 7 }, (_, offset) => {
    const dayDate = new Date(monday);
    dayDate.setUTCDate(dayDate.getUTCDate() + offset);
    const day = dayDate.toISOString().slice(0, 10);
    const entries = weekly.filter(item => item.date === day);
    return { date: day, formattedDate: formatDate(day), expenses: entries, count: entries.length, totalCents: entries.reduce((sum, item) => sum + item.amountCents, 0) };
  });
  return {
    start, end, simulatedRunDate: end, days, expenses: weekly,
    totalCents: days.reduce((sum, item) => sum + item.totalCents, 0),
    categories: CATEGORIES.map(item => ({ id: item.id, label: item.label, color: item.color, totalCents: weekly.filter(expense => expense.category === item.id).reduce((sum, expense) => sum + expense.amountCents, 0) })).filter(item => item.totalCents > 0),
  };
}
function sampleExpenses(value) {
  const report = reportFor([], value);
  const examples = [
    ['Despensa semanal', '58.40', 0, 'Algunas cosas para la semana.'], ['Pago del metro', '12.00', 0, 'Traslado de todos los días.'],
    ['Café con amigos', '9.50', 1, 'Una plática por la tarde.'], ['Recibo de internet', '35.00', 2, 'Pago mensual del servicio.'],
    ['Comida del día', '16.80', 3, ''], ['Cuaderno nuevo', '14.00', 4, 'Para este semestre.', 'shopping'],
    ['Noche de cine', '22.00', 5, 'Plan para el fin de semana.'], ['Desayuno del domingo', '18.50', 6, 'Un comienzo tranquilo.'],
  ];
  return examples.map(([concept, amount, offset, reason, category = 'auto']) => {
    const date = new Date(`${report.start}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return createExpense({ concept, amount, date: date.toISOString().slice(0, 10), reason, category });
  });
}

export async function exportBackup() {
  return { format: 'penny-expenses', version: 1, currency: 'MXN', exportedAt: new Date().toISOString(), expenses: await allExpenses() };
}

export async function importBackup(input) {
  if (input?.currency && input.currency !== 'MXN') throw new Error('Este respaldo utiliza otra moneda. Solo se pueden importar importes en MXN.');
  const items = Array.isArray(input) ? input : input?.format === 'penny-expenses' && input.version === 1 ? input.expenses : null;
  if (!Array.isArray(items)) throw new Error('This file is not a Penny backup or legacy expenses file.');
  if (items.length > 100000) throw new Error('This backup contains too many records.');
  const db = await database();
  const existing = await allExpenses();
  const ids = new Set(existing.map(item => item.id));
  let imported = 0;
  await db.beginTransaction();
  try {
    for (const item of items) {
      if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id)) continue;
      const expense = createExpense({ concept: item.concept, amount: (Number(item.amountCents) / 100).toFixed(2), date: item.date, reason: item.reason ?? '', category: item.category ?? 'auto' });
      expense.id = item.id;
      expense.createdAt = typeof item.createdAt === 'string' ? item.createdAt : expense.createdAt;
      await insertExpense(expense, false);
      ids.add(item.id);
      imported++;
    }
    await db.commitTransaction();
  } catch (error) {
    await db.rollbackTransaction();
    throw error;
  }
  return { imported, skipped: items.length - imported };
}

export async function requestLocal(path, options = {}) {
  const pathname = path.split('?')[0];
  const query = new URLSearchParams(path.split('?')[1] ?? '');
  const method = options.method ?? 'GET';
  const body = options.body ? JSON.parse(options.body) : {};
  const all = await allExpenses();
  if (pathname === '/categories' && method === 'GET') return CATEGORIES.map(({ id, label, color }) => ({ id, label, color }));
  if (pathname === '/expenses' && method === 'GET') return all;
  if (pathname === '/reports/weekly' && method === 'GET') return reportFor(all, query.get('date'));
  if (pathname === '/expenses' && method === 'POST') return insertExpense(createExpense(body));
  if (pathname === '/demo' && method === 'POST') {
    if (all.length) throw new Error('Sample expenses can only be loaded into an empty tracker.');
    const samples = sampleExpenses(body.date);
    const db = await database();
    await db.beginTransaction();
    try { for (const expense of samples) await insertExpense(expense, false); await db.commitTransaction(); }
    catch (error) { await db.rollbackTransaction(); throw error; }
    return samples;
  }
  const expenseRoute = pathname.match(/^\/expenses\/([^/]+)$/);
  if (expenseRoute && method === 'PUT') {
    const existing = all.find(item => item.id === decodeURIComponent(expenseRoute[1]));
    if (!existing) throw new Error('Expense not found.');
    const updated = createExpense(body, existing);
    await (await database()).run('UPDATE expenses SET concept=?, amountCents=?, date=?, formattedDate=?, reason=?, category=?, categoryLabel=?, color=? WHERE id=?', [updated.concept, updated.amountCents, updated.date, updated.formattedDate, updated.reason, updated.category, updated.categoryLabel, updated.color, updated.id]);
    return updated;
  }
  if (expenseRoute && method === 'DELETE') {
    const result = await (await database()).run('DELETE FROM expenses WHERE id = ?', [decodeURIComponent(expenseRoute[1])]);
    if (!result.changes?.changes) throw new Error('Expense not found.');
    return null;
  }
  throw new Error('Esta operación no está disponible en la aplicación local.');
}
