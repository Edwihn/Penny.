import { app } from './app.js';
import { ExpenseStore } from './storage/ExpenseStore.js';

ExpenseStore.getInstance(); // Fail clearly at startup if existing storage cannot be read.
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => console.log(`Expense Tracker API: http://${host}:${port}`));
