# Justification outline — Expense Tracker prototype

**Suggested length:** 750–950 words, approximately 1–2 pages depending on formatting. Use this outline to write in your own voice and include one compact screenshot if permitted. The goal is to explain why these choices fit this university lab, rather than claim they are the only possible solution.

## 1. Problem, users and scope (80–100 words)

- Introduce the problem: small daily expenses are hard to understand as disconnected records.
- Identify the user: a student tracking personal spending locally.
- State the four delivered features: registration with optional context, proportional category pie chart, matching expense list, and Monday–Sunday report with daily and weekly totals.
- Define success: changes appear in the UI, records survive a server restart, and the grader can locate exactly three patterns.
- Suggested thesis: “React, Tailwind CSS and Express provide a manageable full-stack prototype, while MVC, Singleton and Factory give each part a clear responsibility.”

## 2. Technology choices tied to the actual implementation (170–210 words)

- **React:** component-based rendering makes the form, chart, list and report independently understandable. State updates refresh the visible report after saving or deletion. Reference `App.jsx` and the four components; explain the user benefit rather than simply defining React.
- **Tailwind CSS:** reusable utilities such as grid, flex, spacing and responsive layout speed up consistent UI work. The Vite plugin compiles styles; `styles.css` provides custom visual treatment and mobile rules. Mention labels, feedback, clear category labels and colors.
- **Node.js/Express:** one language across frontend and backend reduces context switching. Explicit routes expose a small REST API and backend validation keeps creation rules consistent for all callers.
- **Recharts:** builds reliable amount-proportional slices from the report's category totals. The same backend-assigned colors appear in the list.
- **Persistent JSON:** keeps installation simple for a local lab. Acknowledge the single-process limit and why a production multi-user system would need stronger storage.

## 3. MVC: keep presentation, requests and data rules separate (120–150 words)

- Define MVC briefly, then identify its concrete roles using the README's source-location table.
- Model: `server/src/models/Expense.js` owns data operations and report calculations.
- View: `client/src/App.jsx` and `client/src/components/*` display data and collect input.
- Controller: `server/src/controllers/expenseController.js` handles Express requests and responses; `routes/expenseRoutes.js` supplies route mappings.
- Trace one action: user saves a coffee expense → POST → controller → model → Factory and Singleton → JSON → React updates chart/list.
- Explain the value: styling changes do not affect report calculations; validation is tested without opening the UI.
- State that Model, View and Controller are **three roles within one pattern**, not three separate patterns.

## 4. Singleton: one owner for local storage (100–120 words)

- Cite `server/src/storage/ExpenseStore.js`, especially private static `#instance`, `getInstance()`, and the constructor returning the existing instance.
- Explain why every request must see the same expense collection and file path.
- Describe persistence: write a temporary JSON file, atomically replace the saved file, and then update the in-memory array.
- Evidence: the backend test checks that constructor access and `getInstance()` return the same object, and another process can reload saved data.
- State the boundary honestly: the Singleton is process-local; it is not a distributed lock or a replacement for a production database.

## 5. Factory: consistent expense creation (120–150 words)

- Cite `server/src/factories/ExpenseFactory.js`, `ExpenseFactory.create()` and the category table.
- Describe input and output: concept, amount, date, optional reason/category become a complete object with an ID, integer cents, category label/color and formatted date.
- Use a concrete example: “Coffee with friends”, `12.50`, `2026-09-17` → Food & drinks, `#eaaa43`, `1250` cents, `17/sep/26 thursday`.
- Clarify that the concept determines category/color; the entered date determines the calendar label.
- Explain unknown concepts (Other), explicit category overrides, and shared validation for both demo and user expenses.
- Name the implemented variant precisely: **Simple Factory**. No subclass hierarchy or extra pattern is needed for the lab.

## 6. Correctness, demonstration and limitations (100–140 words)

- Reports include Monday through Sunday, with seven rows even for days with no expenses. Integer cents ensure exact sums; display formatting converts to dollars.
- Explain the manual Sunday simulation and downloadable PDF report with itemized expenses, notes and daily subtotals. Do not describe it as a real scheduled job.
- Cite test evidence: valid/invalid dates, year and leap-day boundaries, Singleton identity, persistent records, exact weekly totals, browser save/edit/delete/report flow, persistent light/dark preference and responsive layout checks.
- Include a screenshot of the chart/list or weekly report, if space permits.
- Close with a direct connection to the rubric: all four features work end-to-end, and exactly MVC, Singleton and Factory are explicitly implemented and documented.

## Evidence to attach or mention

- Screenshot of two or more differently colored categories, matching dots and amounts.
- Screenshot of a Sunday report with seven days and its weekly total.
- README pattern-location table and `// PATTERN:` source markers.
- Output of `npm test`, `npm run build` and `npm run test:e2e` from your machine.
- State the demonstrated limitations: single user, one backend process, local JSON persistence, USD only, manual report simulation, English keyword inference with manual override.

## Suggested references

- React documentation: https://react.dev/learn
- Tailwind CSS Vite setup: https://tailwindcss.com/docs/installation/using-vite
- Express documentation: https://expressjs.com/
- Recharts documentation: https://recharts.org/
- Course materials defining MVC, Singleton and Factory. Use your instructor's preferred citation format.
