# Penny — Expense Tracker

A complete university lab prototype with a React dashboard, an Express API, persistent local storage, and **exactly three deliberately implemented design patterns: MVC, Singleton, and Factory**.

## Technologies

- React 19 and Vite 7: interactive frontend and development server.
- Tailwind CSS 4: utility styling, alongside custom responsive CSS.
- Recharts 3: amount-proportional pie/donut chart, grouped by category.
- Lucide React: interface icons.
- pdfmake: downloadable PDFs with embedded fonts, wrapped notes and automatic page breaks.
- Node.js and Express 5: REST API, validation and weekly reports.
- Local JSON file: persistent storage managed by a Singleton; no database installation or credentials.
- Node's built-in test runner and Playwright: backend and browser verification.
- npm workspaces and Concurrently: install and run both applications from the root.

## Quick start

1. Install **Node.js 22.12 or later** (Node 22 LTS recommended), including npm. Verify with `node --version` and `npm --version`.
2. Open a terminal in this project folder, the folder containing this README and root `package.json`.
3. Install all frontend and backend dependencies with:

   ```sh
   npm install
   ```

   A root `package-lock.json` is included. On subsequent clean installations, use `npm ci` for the tested dependency versions. Internet access is needed for the initial installation.

4. Start both applications:

   ```sh
   npm run dev
   ```

5. Open **http://127.0.0.1:5173**. The API runs at **http://127.0.0.1:3001/api**. Keep the terminal running. Press Ctrl+C to stop both.
6. Add your first expense, or click **Load sample week** to insert eight sample expenses. Sample data loads only when the entire tracker is empty, so existing records are never replaced.

No `.env` file is required. Vite proxies `/api` to Express, so the browser uses one origin and needs no CORS configuration.

### Run in two terminals instead

From the project root in terminal 1:

```sh
npm run dev:server
```

From the same root in terminal 2:

```sh
npm run dev:client
```

### Production-style local run

Stop the development servers, then run:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:3001**. Express serves both the compiled frontend and API. This is a local run, not a deployment.

## Using the prototype

1. Enter a concept, positive amount, and date. A reason is optional.
2. Keep **Auto-detect from name** or choose a category. For example, “Coffee with friends” becomes Food & drinks; “Metro pass” becomes Transport. Unknown concepts become Other. An explicit category overrides inference.
3. Click **Save expense**. The selected week moves to the expense's week when necessary. The chart and list refresh from the backend.
4. Use week arrows, **This week**, or **Jump to date** to inspect a different Monday–Sunday period. The chart, total, average, category totals, and list all use that selected period.
5. Search expenses by name, category, or reason. Search filters the list; the chart continues to represent the whole selected week.
6. Open **Weekly report**, click **Simulate Sunday report**, and optionally **Download report (.pdf)**. Both the screen and PDF list each day's expenses, categories, notes and amounts, followed by daily subtotals and the weekly total. Zero-spending days are included.
7. Use the pencil icon to edit an expense in the Overview form. Save changes or cancel; saving recalculates the category/color and reports, preserves the ID, and opens the new week if you change the date.
8. Use the moon/sun button at the top to switch between light and dark modes. The first visit follows the system preference; your choice is then saved in the browser.
9. Use an expense's trash icon and confirmation dialog to delete it. Totals update immediately.

All money is USD, with no currency conversion. Entered amounts are stored as integer cents to avoid floating-point addition errors. Each category's pie slice is proportional to its combined expense amount; list dots use the exact same Factory-assigned color.

Dates are stored as `YYYY-MM-DD`. The Factory formats `2026-09-17` as **`17/sep/26 thursday`**. The **concept controls category/color**, while the **entered calendar date controls the formatted date**. A concept cannot determine when an expense happened. UTC-based calendar arithmetic prevents timezone/DST shifts.

The Sunday feature is an explicit simulation: selecting any day resolves its Monday–Sunday week; clicking the button fetches the report as if run on that Sunday. There is no cron job or actual background schedule. Future entries, if entered, are included in their selected week.

## Folder structure

```text
.
├── package.json / package-lock.json   # Workspace commands and locked dependencies
├── README.md
├── docs/JUSTIFICATION_OUTLINE.md
├── docs/ANDROID_AND_STORAGE.md       # Shared storage and Samsung/APK guide
├── playwright.config.js
├── tests/tracker.spec.js              # Browser flow
├── client/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── public/favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                   # MVC View and page state
│       ├── api.js                    # HTTP requests and visible errors
│       ├── reportPdf.js              # Detailed PDF rendering
│       ├── utils.js
│       ├── styles.css
│       └── components/
│           ├── ExpenseForm.jsx
│           ├── SpendingChart.jsx
│           ├── ExpenseList.jsx
│           ├── ThemeToggle.jsx
│           └── WeeklyReport.jsx
└── server/
    ├── package.json
    ├── data/expenses.json             # Automatically created on first write
    ├── test/expense.test.js
    └── src/
        ├── index.js
        ├── app.js
        ├── routes/expenseRoutes.js
        ├── controllers/expenseController.js
        ├── models/Expense.js
        ├── factories/ExpenseFactory.js
        ├── storage/ExpenseStore.js
        └── utils/dates.js
```

## Exact pattern locations

Line numbers refer to the delivered source. Search for `PATTERN:` to find stable section markers after any edits.

| Required pattern | Exact files and sections | Responsibility and evidence |
| --- | --- | --- |
| **MVC — Model** | `server/src/models/Expense.js`, lines **5–59**, `Expense` class | Defines the expense structure, accesses stored expenses, creates/updates/deletes records, and calculates reports. `weeklyReport()` starts at line **28**. |
| **MVC — View** | `client/src/App.jsx`, lines **11–121**, plus `client/src/components/ExpenseForm.jsx` starting at line **5** and the other UI components | Renders React forms, pie chart, list and report. Requests model results through HTTP; never reads the JSON storage file. |
| **MVC — Controller** | `server/src/controllers/expenseController.js`, lines **4–32**; route wiring in `server/src/routes/expenseRoutes.js`, lines **5–12** | Receives Express requests, calls model operations, and returns JSON/status codes. Routes dispatch to controllers. These three MVC roles count as **one pattern**. |
| **Singleton** | `server/src/storage/ExpenseStore.js`, lines **5–51**; private static instance at line **7**, constructor at line **11**, `getInstance()` at line **20** | All model operations share one state/file manager. Even `new ExpenseStore()` returns the existing instance. Tests prove identity and shared persistence. |
| **Factory** | `server/src/factories/ExpenseFactory.js`, lines **13–41**; `ExpenseFactory.create()` at line **15**; category table at lines **4–11** | Validates and creates objects with IDs, cents, category, color and formatted date. Both user entries and demo entries pass through this method. This is the **Simple Factory** form, not a subclass-based Factory Method hierarchy. |

No additional application-level pattern (such as Observer, Strategy, or Repository) is intentionally introduced. Framework internals and ordinary helper functions are not counted as student-implemented patterns.

Request flow: **React View → Express route → Controller → Expense Model → ExpenseFactory / ExpenseStore Singleton → JSON response → React View**.

### Expense object example

```json
{
  "id": "generated-uuid",
  "concept": "Coffee with friends",
  "amountCents": 1250,
  "date": "2026-09-17",
  "formattedDate": "17/sep/26 thursday",
  "reason": "Study break",
  "category": "food",
  "categoryLabel": "Food & drinks",
  "color": "#eaaa43",
  "createdAt": "2026-09-17T12:00:00.000Z"
}
```

## API reference

| Method | Endpoint | Result |
| --- | --- | --- |
| GET | `/api/health` | Health status |
| GET | `/api/categories` | Category IDs, labels, colors |
| GET | `/api/expenses` | All expenses, newest expense dates first |
| POST | `/api/expenses` | Creates an expense; returns 201 |
| PUT | `/api/expenses/:id` | Replaces editable fields using the POST body format; preserves ID/creation time; returns 200, 400 or 404 |
| DELETE | `/api/expenses/:id` | Deletes one expense; returns 204 or 404 |
| GET | `/api/reports/weekly?date=2026-09-17` | Monday–Sunday boundaries, seven daily totals with each day's `expenses` array, weekly total, category totals and matching expenses |
| POST | `/api/demo` | Body `{ "date": "2026-09-17" }`; inserts a sample week only into empty storage |

POST expense body:

```json
{ "concept": "Coffee with friends", "amount": "12.50", "date": "2026-09-17", "reason": "Study break", "category": "auto" }
```

Validation: name 1–100 characters, amount 0.01–1,000,000.00 with at most two decimals, valid calendar date from year 1900, reason up to 500 characters, and a known category or `auto`. Bad input returns JSON `{ "error": "message" }` and status 400.

## Tests and demonstration checklist

Backend unit/integration tests (no development servers needed):

```sh
npm test
```

These verify Factory rules and formatting, Singleton identity, isolated reads, date boundaries, exact weekly totals, empty reports, HTTP validation, deletion, persistence in a new Node process, and validated edits that move totals between weeks. Tests use a temporary file, never your expense data.

Browser tests use dedicated ports 3002 and 5174, so your ordinary development servers and real data remain separate. Those test ports must be free:

```sh
npx playwright install chromium
npm run test:e2e
```

The browser tests run their own servers and use `test-results/e2e-expenses.json`. They cover saving and editing, cancelling edits, chart/list colors, page reload, theme persistence, detailed Sunday reports, real PDF downloads, empty reports and multi-page reports with long Spanish notes, search, deletion, sample data and a mobile overflow check. Screenshots are saved under `test-results/`. To use installed Microsoft Edge instead of downloading Chromium, in PowerShell run `$env:PLAYWRIGHT_CHANNEL='msedge'` before `npm run test:e2e`.

For the graded demo: add “Coffee with friends”, amount `12.50`, date `2026-09-17`, and reason “Study break”; verify the date text and food color; add another category to demonstrate proportional chart segments; generate the report ending September 20; show all seven daily rows and the total; refresh the page to show persistence; explain the three source markers in the table above.

## Storage and troubleshooting

- Data lives at `server/data/expenses.json` and survives server restarts. The directory is created automatically. JSON files are excluded from version control.
- `EXPENSE_DATA_FILE` optionally selects a different absolute file path. Tests use this setting to isolate data.
- The Singleton is **one instance per Node process**. Run only one backend against a given JSON file. This small single-user lab intentionally uses synchronous, atomic file replacement; a production multi-user service would need a database, authentication and concurrency controls.
- If a port is in use, stop the old development process (Ctrl+C). Vite uses strict port 5173 instead of silently moving. Express defaults to 3001. If you change `PORT`, also change the Vite proxy target.
- If the browser cannot reach the API, check the backend terminal and `/api/health`, then click Retry. In development, browse port 5173; for `npm start` after a build, browse port 3001.
- If startup reports damaged JSON or a file permission error, preserve a copy of your data and fix the indicated file or choose another `EXPENSE_DATA_FILE`. Existing invalid storage is never silently erased.
- Category inference uses the documented English keywords in `ExpenseFactory.js`; choose a category manually for other wording/languages.

## Samsung, APK and shared data

See [`docs/ANDROID_AND_STORAGE.md`](docs/ANDROID_AND_STORAGE.md) for the exact storage location, a same-Wi-Fi preview using the optional `HOST` setting, and the steps to build an APK with Capacitor and Android Studio after configuring a shared HTTPS backend. No APK or cloud deployment is included.

## Justification document

Use [`docs/JUSTIFICATION_OUTLINE.md`](docs/JUSTIFICATION_OUTLINE.md) for a detailed, evidence-based 1–2 page writing outline.

Setup references: [Vite getting started](https://vite.dev/guide/) and [Tailwind CSS Vite installation](https://tailwindcss.com/docs/installation/using-vite).
