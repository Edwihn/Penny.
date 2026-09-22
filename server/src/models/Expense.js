import { ExpenseStore } from '../storage/ExpenseStore.js';
import { ExpenseFactory, CATEGORIES } from '../factories/ExpenseFactory.js';
import { addDays, dateISO, formatExpenseDate, parseDate, weekFor } from '../utils/dates.js';

// PATTERN: MVC Model starts here — data access, expense rules and report calculations.
// Expense structure: { id, concept, amountCents, date, formattedDate, reason,
//                      category, categoryLabel, color, createdAt }.
export class Expense {
  static all() {
    return ExpenseStore.getInstance().all().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }

  static create(input) {
    const expense = ExpenseFactory.create(input);
    return ExpenseStore.getInstance().insertMany([expense])[0];
  }

  static update(id, input) {
    const existing = this.all().find(expense => expense.id === id);
    if (!existing) return null;
    // Reuse Factory validation, date formatting and category/color assignment.
    const updated = { ...ExpenseFactory.create(input), id: existing.id, createdAt: existing.createdAt };
    return ExpenseStore.getInstance().update(id, updated);
  }

  static remove(id) { return ExpenseStore.getInstance().remove(id); }

  static weeklyReport(date) {
    const { start, end } = weekFor(date);
    const expenses = this.all().filter(item => item.date >= start && item.date <= end);
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = dateISO(addDays(parseDate(start), index));
      const entries = expenses.filter(item => item.date === day);
      return { date: day, formattedDate: formatExpenseDate(day), expenses: entries, count: entries.length, totalCents: entries.reduce((sum, item) => sum + item.amountCents, 0) };
    });
    return {
      start, end, simulatedRunDate: end, days, expenses,
      totalCents: days.reduce((sum, day) => sum + day.totalCents, 0),
      categories: CATEGORIES.map(category => ({ id: category.id, label: category.label, color: category.color, totalCents: expenses.filter(item => item.category === category.id).reduce((sum, item) => sum + item.amountCents, 0) })).filter(category => category.totalCents > 0),
    };
  }

  static loadDemo(date) {
    if (this.all().length) throw new Error('Sample expenses can only be loaded into an empty tracker.');
    const { start } = weekFor(date);
    const samples = [
      ['Weekly groceries', '58.40', 0, 'A few essentials for the week.'],
      ['Metro pass', '12.00', 0, 'Commute to campus.'],
      ['Coffee with friends', '9.50', 1, 'A little afternoon catch-up.'],
      ['Internet bill', '35.00', 2, 'Monthly internet plan.'],
      ['Lunch on campus', '16.80', 3, ''],
      ['New notebook', '14.00', 4, 'For this semester.', 'shopping'],
      ['Movie night', '22.00', 5, 'Weekend plans.'],
      ['Sunday breakfast', '18.50', 6, 'A slow start to Sunday.'],
    ].map(([concept, amount, offset, reason, category = 'auto']) => ExpenseFactory.create({ concept, amount, date: dateISO(addDays(parseDate(start), offset)), reason, category }));
    return ExpenseStore.getInstance().insertMany(samples);
  }
}
// PATTERN: MVC Model ends here.
