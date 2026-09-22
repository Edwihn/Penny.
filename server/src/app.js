import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expenseRoutes } from './routes/expenseRoutes.js';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', expenseRoutes);
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }));

// After npm run build, the backend also serves the compiled frontend.
const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
if (existsSync(clientDist)) app.use(express.static(clientDist));

app.use((error, _req, res, _next) => {
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'Request is too large.' });
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request must contain valid JSON.' });
  if (error.code || error instanceof SyntaxError) {
    console.error(error);
    return res.status(500).json({ error: 'Storage is unavailable. Check the server terminal.' });
  }
  res.status(400).json({ error: error.message });
});
