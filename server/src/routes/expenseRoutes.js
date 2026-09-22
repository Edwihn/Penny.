import { Router } from 'express';
import { listExpenses, listCategories, createExpense, updateExpense, deleteExpense, weeklyReport, loadDemo } from '../controllers/expenseController.js';

// MVC: routes dispatch requests; controllers coordinate; models own the data rules.
export const expenseRoutes = Router();
expenseRoutes.get('/expenses', listExpenses);
expenseRoutes.post('/expenses', createExpense);
expenseRoutes.put('/expenses/:id', updateExpense);
expenseRoutes.delete('/expenses/:id', deleteExpense);
expenseRoutes.get('/categories', listCategories);
expenseRoutes.get('/reports/weekly', weeklyReport);
expenseRoutes.post('/demo', loadDemo);
