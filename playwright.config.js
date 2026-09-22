import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5174', headless: true, colorScheme: 'light', viewport: { width: 1440, height: 1000 }, channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  webServer: [
    { command: 'npm run dev:server', url: 'http://127.0.0.1:3002/api/health', env: { PORT: '3002', EXPENSE_DATA_FILE: path.resolve('test-results/e2e-expenses.json') }, reuseExistingServer: false },
    { command: 'npm run dev --workspace client -- --port 5174', url: 'http://127.0.0.1:5174', env: { API_PORT: '3002' }, reuseExistingServer: false },
  ],
});
