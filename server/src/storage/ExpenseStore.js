import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// PATTERN: Singleton starts here — one shared storage instance per Node process.
export class ExpenseStore {
  static #instance;
  #file;
  #expenses;

  constructor() {
    if (ExpenseStore.#instance) return ExpenseStore.#instance;
    this.#file = process.env.EXPENSE_DATA_FILE || fileURLToPath(new URL('../../data/expenses.json', import.meta.url));
    mkdirSync(dirname(this.#file), { recursive: true });
    this.#expenses = existsSync(this.#file) ? JSON.parse(readFileSync(this.#file, 'utf8')) : [];
    if (!Array.isArray(this.#expenses)) throw new Error('The expense storage file must contain an array.');
    ExpenseStore.#instance = this;
  }

  static getInstance() {
    return ExpenseStore.#instance ?? new ExpenseStore();
  }

  all() { return structuredClone(this.#expenses); }

  #commit(next) {
    // Synchronous, atomic replacement is sufficient for this small, single-process lab.
    // Update memory only after the write succeeds.
    writeFileSync(`${this.#file}.tmp`, JSON.stringify(next, null, 2), 'utf8');
    renameSync(`${this.#file}.tmp`, this.#file);
    this.#expenses = next;
  }

  insertMany(expenses) {
    this.#commit([...this.#expenses, ...expenses]);
    return structuredClone(expenses);
  }

  update(id, expense) {
    if (!this.#expenses.some(item => item.id === id)) return null;
    this.#commit(this.#expenses.map(item => item.id === id ? expense : item));
    return structuredClone(expense);
  }

  remove(id) {
    if (!this.#expenses.some(expense => expense.id === id)) return false;
    this.#commit(this.#expenses.filter(expense => expense.id !== id));
    return true;
  }
}
// PATTERN: Singleton ends here.
