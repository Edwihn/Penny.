import { Expense } from '../models/Expense.js';
import { CATEGORIES } from '../factories/ExpenseFactory.js';

// PATTERN: MVC Controller starts here — translate HTTP requests into model operations.
export function listExpenses(_req, res) { res.json(Expense.all()); }
export function listCategories(_req, res) {
  res.json(CATEGORIES.map(({ id, label, color }) => ({ id, label, color })));
}
export function createExpense(req, res, next) {
  try { res.status(201).json(Expense.create(req.body)); }
  catch (error) { next(error); }
}
export function updateExpense(req, res, next) {
  try {
    const expense = Expense.update(req.params.id, req.body);
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.json(expense);
  } catch (error) { next(error); }
}
export function deleteExpense(req, res) {
  if (!Expense.remove(req.params.id)) return res.status(404).json({ error: 'Expense not found.' });
  res.status(204).end();
}
export function weeklyReport(req, res, next) {
  try { res.json(Expense.weeklyReport(req.query.date)); }
  catch (error) { next(error); }
}
export function loadDemo(req, res, next) {
  try { res.status(201).json(Expense.loadDemo(req.body?.date)); }
  catch (error) { next(error); }
}
// PATTERN: MVC Controller ends here.
