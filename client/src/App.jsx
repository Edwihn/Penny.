import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChartNoAxesCombined, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, Leaf, Plus, ReceiptText, Sparkles, Wallet, X } from 'lucide-react';
import { request } from './api.js';
import { localToday, money, moveWeek, shortDate } from './utils.js';
import ExpenseForm from './components/ExpenseForm.jsx';
import SpendingChart from './components/SpendingChart.jsx';
import ExpenseList from './components/ExpenseList.jsx';
import WeeklyReport from './components/WeeklyReport.jsx';

// PATTERN: MVC View starts here — React renders model data delivered by controllers.
export default function App() {
  const [page, setPage] = useState('overview');
  const [date, setDate] = useState(localToday);
  const [report, setReport] = useState(null);
  const [categories, setCategories] = useState([]);
  const [allCount, setAllCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [generated, setGenerated] = useState(false);
  const [help, setHelp] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const sequence = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    setError('');
    try {
      const [nextReport, nextCategories, allExpenses] = await Promise.all([request(`/reports/weekly?date=${encodeURIComponent(date)}`), request('/categories'), request('/expenses')]);
      if (current === sequence.current) {
        setReport(nextReport); setCategories(nextCategories); setAllCount(allExpenses.length);
      }
      return true;
    } catch (failure) {
      if (current === sequence.current) setError(failure.message);
      return false;
    } finally { if (current === sequence.current) setLoading(false); }
  }, [date]);

  useEffect(() => { setGenerated(false); setSearch(''); refresh(); }, [refresh]);

  useEffect(() => {
    if (editing && page === 'overview') {
      document.getElementById('concept')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('concept')?.focus({ preventScroll: true });
    }
  }, [editing, page]);

  async function saveExpense(input) {
    setBusy(true); setNotice('');
    try {
      await request(editing ? `/expenses/${editing.id}` : '/expenses', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(input) });
      setGenerated(false);
      if (editing) { setNotice('Expense updated. Your chart and report reflect the changes.'); setEditing(null); }
      // Move to the saved expense's week so it is immediately visible.
      if (input.date < report.start || input.date > report.end) setDate(input.date);
      else await refresh();
    } finally { setBusy(false); }
  }

  async function loadDemo() {
    setBusy(true); setNotice('');
    try {
      await request('/demo', { method: 'POST', body: JSON.stringify({ date }) });
      await refresh(); setNotice('Sample week added. Explore it, or delete individual entries to make it yours.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function deleteExpense() {
    setBusy(true);
    try {
      await request(`/expenses/${pendingDelete.id}`, { method: 'DELETE' });
      if (editing?.id === pendingDelete.id) setEditing(null);
      setPendingDelete(null); setGenerated(false); await refresh();
      setNotice('Expense deleted. Your totals have been updated.');
    } catch (failure) { setError(failure.message); setPendingDelete(null); }
    finally { setBusy(false); }
  }

  async function generateReport() {
    setBusy(true);
    const success = await refresh();
    setGenerated(success); setBusy(false);
  }

  const total = report?.totalCents ?? 0;
  const count = report?.expenses.length ?? 0;
  const largest = report?.categories.reduce((best, item) => !best || item.totalCents > best.totalCents ? item : best, null);
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('overview'); }} aria-label="Penny home"><span className="brand-mark"><Leaf size={24} strokeWidth={1.6} /></span>penny<span className="brand-period">.</span></a>
      <div className="workspace-label">YOUR PERSONAL SPACE</div>
      <nav aria-label="Main navigation"><button className={`nav-item ${page === 'overview' ? 'active' : ''}`} onClick={() => setPage('overview')}><LayoutDashboard size={18} />Overview</button><button className={`nav-item ${page === 'report' ? 'active' : ''}`} onClick={() => setPage('report')}><ChartNoAxesCombined size={18} />Weekly report</button></nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><div className="plant-art"><Leaf size={34} strokeWidth={1.1} /><span>✦</span></div><h3>Small habits.<br />Brighter tomorrows.</h3><p>A little awareness goes a long way. You’re in the right place.</p></div><button className="help-button" onClick={() => setHelp(true)}><CircleHelp size={17} />How Penny works<ArrowUpRight size={14} /></button><div className="profile"><span>Y</span><div><strong>Your workspace</strong><small>Personal expense tracker</small></div><span className="online-dot" /></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><span>My workspace <span className="breadcrumb-divider">/</span> <strong>{page === 'overview' ? 'Overview' : 'Weekly report'}</strong></span><span className="local-badge"><span />Saved to local server</span></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow">A LITTLE CLARITY, EVERY DAY</div><h1>{page === 'overview' ? 'Your money, at a glance.' : 'A week worth understanding.'}</h1><p>{page === 'overview' ? 'Make sense of your spending. Make room for what matters.' : 'Turn everyday spending into a clearer weekly picture.'}</p></div>{page === 'overview' && <button className="primary-button heading-add" onClick={() => { setEditing(null); document.getElementById('concept')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.getElementById('concept')?.focus({ preventScroll: true }); }} disabled={loading || !report}><Plus size={17} />Add expense</button>}</div>
        <div className="week-toolbar"><div className="week-selector"><CalendarDays size={17} /><span>{report ? `${shortDate(report.start)} – ${shortDate(report.end)}, ${report.end.slice(0, 4)}` : 'Choose your week'}</span><button aria-label="Previous week" disabled={loading || busy} onClick={() => setDate(moveWeek(date, -1))}><ChevronLeft size={17} /></button><button aria-label="Next week" disabled={loading || busy} onClick={() => setDate(moveWeek(date, 1))}><ChevronRight size={17} /></button></div><div className="week-actions"><button onClick={() => setDate(localToday())} disabled={loading || busy}>This week</button><label className="date-picker-label">Jump to date<input type="date" aria-label="Choose a date in the report week" value={date} min="1900-01-01" max="9999-12-24" disabled={busy} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></label></div></div>
        {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={refresh} disabled={loading}>Retry</button></div>}
        {notice && <div className="notice-banner" role="status"><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16} /></button></div>}
        {loading && <p role="status" className="loading-label">Updating your week…</p>}
        {report && <>
          <div className="stats-grid"><div className="stat-card"><div className="stat-label">Total this week<span className="stat-icon green"><Wallet size={17} /></span></div><strong>{money(total)}</strong><span className="stat-caption"><span className="tiny-dot" />Across {count} expenses</span></div><div className="stat-card"><div className="stat-label">Daily average<span className="stat-icon amber"><CalendarDays size={17} /></span></div><strong>{money(Math.round(total / 7))}</strong><span className="stat-caption">A little perspective, over 7 days</span></div><div className="stat-card"><div className="stat-label">Top category<span className="stat-icon lavender"><ArrowDownLeft size={18} /></span></div><strong className="category-stat">{largest?.label ?? 'A fresh start'}</strong><span className="stat-caption">{largest ? `${money(largest.totalCents)} · ${Math.round(largest.totalCents / total * 100)}% of your week` : 'Your first expense starts the story'}</span></div></div>
          {page === 'overview' ? <div className="dashboard-grid"><div className="dashboard-left"><SpendingChart report={report} /><ExpenseList expenses={report.expenses} search={search} onSearch={setSearch} onDelete={setPendingDelete} onEdit={setEditing} busy={busy || loading} /></div><div className="dashboard-right"><ExpenseForm key={editing?.id ?? "new"} categories={categories} onSave={saveExpense} saving={busy || loading} editing={editing} onCancel={() => setEditing(null)} /><div className="weekly-prompt"><span className="icon-box"><ReceiptText size={19} /></span><h3>See the bigger picture.</h3><p>Your Sunday recap brings the whole week together.</p><button onClick={() => setPage('report')}>Explore weekly report<ArrowUpRight size={16} /></button></div></div></div> : <WeeklyReport report={report} generated={generated} onGenerate={generateReport} busy={busy || loading} />}
          {allCount === 0 && <div className="demo-banner"><span><Sparkles size={16} />Want to take a look around first?</span><button onClick={loadDemo} disabled={busy || loading}>Load sample week <ArrowUpRight size={14} /></button></div>}
        </>}
        <footer><span className="flex items-center gap-1.5"><Leaf size={13} />A little more mindful. A little more you.</span><span>Penny · Student lab prototype</span></footer>
      </main>
    </div>
    {help && <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="help-title" className="modal-card"><button autoFocus className="modal-close" onClick={() => setHelp(false)} aria-label="Close help"><X size={20} /></button><span className="icon-box"><Leaf size={24} /></span><h2 id="help-title">A little clarity with Penny.</h2><p>Add a name, amount, and date. Penny assigns a category from words such as “coffee”, “bus”, or “internet”. You can also choose a category yourself.</p><p>The chart and list show your selected Monday–Sunday week. Use the arrows or date picker to explore another week.</p><p>Open Weekly report to simulate Sunday’s recap and download a PDF with each expense, note, and daily subtotal. Data stays in a JSON file on your local backend. Amounts are in USD.</p><button className="primary-button" onClick={() => setHelp(false)}>Got it</button></section></div>}
    {pendingDelete && <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="modal-card"><h2 id="delete-title">Delete this expense?</h2><p>“{pendingDelete.concept}” ({money(pendingDelete.amountCents)}) will be removed from your tracker.</p><div className="flex gap-3 mt-6"><button autoFocus className="secondary-button" disabled={busy} onClick={() => setPendingDelete(null)}>Keep expense</button><button className="danger-button" disabled={busy} onClick={deleteExpense}>{busy ? 'Deleting…' : 'Delete expense'}</button></div></section></div>}
  </div>;
}
// PATTERN: MVC View ends here.
