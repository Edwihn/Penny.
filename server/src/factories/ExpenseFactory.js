import { randomUUID } from 'node:crypto';
import { formatExpenseDate } from '../utils/dates.js';

export const CATEGORIES = Object.freeze([
  { id: 'food', label: 'Food & drinks', color: '#eaaa43', keywords: ['coffee', 'lunch', 'dinner', 'breakfast', 'food', 'grocery', 'groceries', 'restaurant', 'cafe', 'pizza'] },
  { id: 'transport', label: 'Transport', color: '#689b8a', keywords: ['bus', 'uber', 'taxi', 'train', 'fuel', 'gas', 'metro', 'transport', 'parking'] },
  { id: 'shopping', label: 'Shopping', color: '#9c8cbd', keywords: ['shop', 'shopping', 'clothes', 'shirt', 'shoes', 'clothing'] },
  { id: 'bills', label: 'Bills & utilities', color: '#648fba', keywords: ['rent', 'internet', 'electricity', 'water', 'bill', 'phone', 'utilities'] },
  { id: 'entertainment', label: 'Entertainment', color: '#d67b68', keywords: ['movie', 'cinema', 'netflix', 'game', 'concert', 'spotify'] },
  { id: 'other', label: 'Other', color: '#969c98', keywords: [] },
]);

// PATTERN: Factory starts here — every new expense is created through this method.
export class ExpenseFactory {
  static create(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Enter expense details.');
    const { concept, amount, date, reason = '', category = 'auto' } = input;
    if (typeof concept !== 'string' || !concept.trim() || concept.trim().length > 100) {
      throw new Error('Concept must contain 1–100 characters.');
    }
    const amountText = typeof amount === 'number' || typeof amount === 'string' ? String(amount) : '';
    if (!/^\d+(\.\d{1,2})?$/.test(amountText)) throw new Error('Amount must be positive with at most two decimal places.');
    const amountCents = Math.round(Number(amountText) * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 100000000) {
      throw new Error('Amount must be between 0.01 and 1,000,000.00.');
    }
    if (typeof reason !== 'string' || reason.length > 500) throw new Error('Reason must be text of at most 500 characters.');
    const words = concept.toLowerCase().split(/[^\p{L}\p{N}]+/u);
    const selected = category === 'auto'
      ? CATEGORIES.find(item => item.keywords.some(word => words.includes(word))) ?? CATEGORIES.at(-1)
      : CATEGORIES.find(item => item.id === category);
    if (!selected) throw new Error('Choose a valid category or automatic detection.');
    return {
      id: randomUUID(), concept: concept.trim(), amountCents,
      date, formattedDate: formatExpenseDate(date), reason: reason.trim(),
      category: selected.id, categoryLabel: selected.label, color: selected.color,
      createdAt: new Date().toISOString(),
    };
  }
}
// PATTERN: Factory ends here.
