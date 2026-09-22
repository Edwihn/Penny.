import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ExpenseFactory } from '../src/factories/ExpenseFactory.js';
import { ExpenseStore } from '../src/storage/ExpenseStore.js';
import { weekFor } from '../src/utils/dates.js';

const directory = mkdtempSync(join(tmpdir(), 'penny-test-'));
process.env.EXPENSE_DATA_FILE = join(directory, 'expenses.json');
const { app } = await import('../src/app.js');
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
after(async () => {
  await new Promise(resolve => server.close(resolve));
  rmSync(directory, { recursive: true, force: true });
});
const sample = { concept: 'Coffee with friends', amount: '10.10', date: '2026-09-17', reason: 'Study break' };
const post = body => fetch(`${base}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('Factory assigns a category, matching color, exact cents and the rubric date', () => {
  const expense = ExpenseFactory.create(sample);
  assert.equal(expense.category, 'food');
  assert.equal(expense.color, '#eaaa43');
  assert.equal(expense.amountCents, 1010);
  assert.equal(expense.formattedDate, '17/sep/26 thursday');
  assert.equal(expense.reason, 'Study break');
  assert.ok(expense.id);
  assert.equal(ExpenseFactory.create({ ...sample, concept: 'Unrecognized item' }).category, 'other');
  assert.equal(ExpenseFactory.create({ ...sample, category: 'shopping' }).category, 'shopping');
  assert.equal(ExpenseFactory.create({ ...sample, reason: undefined }).reason, '');
});

test('Factory rejects invalid dates, categories, names, reasons and amounts', () => {
  for (const change of [{ date: '2026-02-30' }, { date: '17/sep/26' }, { amount: 0 }, { amount: -1 }, { amount: '2.001' }, { amount: '1e3' }, { amount: true }, { amount: '1000000.01' }, { concept: '  ' }, { category: 'invalid' }, { reason: 123 }]) {
    assert.throws(() => ExpenseFactory.create({ ...sample, ...change }));
  }
});

test('Singleton identity cannot be bypassed with the constructor; reads are isolated copies', () => {
  assert.equal(ExpenseStore.getInstance(), new ExpenseStore());
  const entries = ExpenseStore.getInstance().all();
  entries.push({ id: 'not-saved' });
  assert.equal(ExpenseStore.getInstance().all().length, 0);
});

test('Monday–Sunday boundaries include Sunday and cross months and years correctly', () => {
  assert.deepEqual(weekFor('2026-09-20'), { start: '2026-09-14', end: '2026-09-20' });
  assert.deepEqual(weekFor('2026-01-01'), { start: '2025-12-29', end: '2026-01-04' });
  assert.deepEqual(weekFor('2024-02-29'), { start: '2024-02-26', end: '2024-03-03' });
});

test('HTTP flow: create, list, weekly aggregation, persistence across processes and delete', async () => {
  const createdResponse = await post(sample);
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  await post({ ...sample, amount: '0.20', date: '2026-09-20', reason: '' });
  await post({ ...sample, amount: '0.10', date: '2026-09-14' });
  await post({ ...sample, amount: '99.00', date: '2026-09-21' });
  const report = await (await fetch(`${base}/reports/weekly?date=2026-09-17`)).json();
  assert.equal(report.days.length, 7);
  assert.equal(report.totalCents, 1040);
  assert.equal(report.categories[0].totalCents, 1040);
  assert.equal(report.days[6].totalCents, 20);
  assert.equal(report.days[3].expenses[0].concept, sample.concept);
  assert.equal(report.days[3].expenses[0].reason, sample.reason);
  assert.deepEqual(report.days[1].expenses, []);
  assert.equal(report.simulatedRunDate, '2026-09-20');
  assert.equal(report.days[1].totalCents, 0);
  assert.equal((await (await fetch(`${base}/expenses`)).json()).length, 4);
  assert.equal(JSON.parse(readFileSync(process.env.EXPENSE_DATA_FILE, 'utf8')).length, 4);
  const storageUrl = new URL('../src/storage/ExpenseStore.js', import.meta.url).href;
  const count = execFileSync(process.execPath, ['--input-type=module', '-e', `import { ExpenseStore } from '${storageUrl}'; console.log(ExpenseStore.getInstance().all().length);`], { env: process.env, encoding: 'utf8' });
  assert.equal(count.trim(), '4');
  assert.equal((await fetch(`${base}/expenses/${created.id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(`${base}/expenses/${created.id}`, { method: 'DELETE' })).status, 404);
});

test('API exposes clear errors and an empty report; failed writes do not add expenses', async () => {
  const before = ExpenseStore.getInstance().all().length;
  assert.equal((await post({ ...sample, amount: '-3' })).status, 400);
  assert.equal((await fetch(`${base}/reports/weekly?date=bad`)).status, 400);
  assert.equal((await fetch(`${base}/missing`)).status, 404);
  const malformed = await fetch(`${base}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(malformed.status, 400);
  assert.equal(ExpenseStore.getInstance().all().length, before);
  const empty = await (await fetch(`${base}/reports/weekly?date=2020-01-01`)).json();
  assert.equal(empty.totalCents, 0);
  assert.equal(empty.days.length, 7);
  assert.deepEqual(empty.categories, []);
});

test('Editing preserves identity, validates before writing, persists and moves report totals', async () => {
  const original = await (await post(sample)).json();
  const replace = body => fetch(`${base}/expenses/${original.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const before = JSON.parse(readFileSync(process.env.EXPENSE_DATA_FILE, 'utf8'));
  assert.equal((await replace({ ...sample, amount: '-5' })).status, 400);
  assert.deepEqual(JSON.parse(readFileSync(process.env.EXPENSE_DATA_FILE, 'utf8')), before);
  const response = await replace({ concept: 'Metro estación', amount: '23.45', date: '2026-10-02', category: 'auto', reason: 'Cambio de día y categoría.' });
  assert.equal(response.status, 200);
  const updated = await response.json();
  assert.equal(updated.id, original.id);
  assert.equal(updated.createdAt, original.createdAt);
  assert.equal(updated.amountCents, 2345);
  assert.equal(updated.category, 'transport');
  assert.equal(updated.color, '#689b8a');
  assert.equal(updated.formattedDate, '02/oct/26 friday');
  const nextWeek = await (await fetch(`${base}/reports/weekly?date=2026-10-02`)).json();
  assert.equal(nextWeek.totalCents, 2345);
  assert.equal(nextWeek.days[4].expenses[0].reason, 'Cambio de día y categoría.');
  const oldWeek = await (await fetch(`${base}/reports/weekly?date=2026-09-17`)).json();
  assert.equal(oldWeek.expenses.some(expense => expense.id === original.id), false);
  assert.equal(JSON.parse(readFileSync(process.env.EXPENSE_DATA_FILE, 'utf8')).find(expense => expense.id === original.id).amountCents, 2345);
  assert.equal((await fetch(`${base}/expenses/missing`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sample) })).status, 404);
});
