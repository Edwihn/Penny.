import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CalendarDays, ChartNoAxesCombined, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, Leaf, Plus, ReceiptText, Sparkles, Wallet, X } from 'lucide-react';
import { request } from './api.js';
import { localToday, money, moveWeek, shortDate } from './utils.js';
import ExpenseForm from './components/ExpenseForm.jsx';
import SpendingChart from './components/SpendingChart.jsx';
import ExpenseList from './components/ExpenseList.jsx';
import WeeklyReport from './components/WeeklyReport.jsx';
import BackupControls from './components/BackupControls.jsx';
import { Capacitor } from '@capacitor/core';

// PATTERN: MVC View starts here — React renders model data delivered by controllers.
const isNative = Capacitor.isNativePlatform();
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
      if (editing) { setNotice('Gasto actualizado. El reporte ya refleja los cambios.'); setEditing(null); }
      // Move to the saved expense's week so it is immediately visible.
      if (input.date < report.start || input.date > report.end) setDate(input.date);
      else await refresh();
    } finally { setBusy(false); }
  }

  async function loadDemo() {
    setBusy(true); setNotice('');
    try {
      await request('/demo', { method: 'POST', body: JSON.stringify({ date }) });
      await refresh(); setNotice('Agregamos una semana de ejemplo. Puedes editar o eliminar sus gastos.');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function deleteExpense() {
    setBusy(true);
    try {
      await request(`/expenses/${pendingDelete.id}`, { method: 'DELETE' });
      if (editing?.id === pendingDelete.id) setEditing(null);
      setPendingDelete(null); setGenerated(false); await refresh();
      setNotice('Gasto eliminado. Los totales están actualizados.');
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
      <div className="workspace-label">TU ESPACIO PERSONAL</div>
      <nav aria-label="Navegación principal"><button className={`nav-item ${page === 'overview' ? 'active' : ''}`} onClick={() => setPage('overview')}><LayoutDashboard size={18} />Resumen</button><button className={`nav-item ${page === 'report' ? 'active' : ''}`} onClick={() => setPage('report')}><ChartNoAxesCombined size={18} />Reporte semanal</button></nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><div className="plant-art"><Leaf size={34} strokeWidth={1.1} /><span>✦</span></div><h3>Pequeños hábitos.<br />Un futuro más claro.</h3><p>Entender tus gastos empieza con cada pequeño detalle.</p></div><button className="help-button" onClick={() => setHelp(true)}><CircleHelp size={17} />Cómo usar Penny<ArrowUpRight size={14} /></button><div className="profile"><span>T</span><div><strong>Tu espacio</strong><small>Control de gastos personales</small></div><span className="online-dot" /></div></div>
    </aside>
    <div className="main-shell"><header className={`topbar${isNative ? ' native-tools' : ''}`}><span>Mi espacio <span className="breadcrumb-divider">/</span> <strong>{page === 'overview' ? 'Resumen' : 'Reporte semanal'}</strong></span><BackupControls onChanged={refresh} /><span className="local-badge"><span />{isNative ? 'Guardado en este teléfono' : 'Guardado en tu computadora'}</span></header>
      <main>
        <div className="page-heading"><div><div className="eyebrow">UN POCO MÁS DE CLARIDAD, CADA DÍA</div><h1>{page === 'overview' ? 'Tus gastos, de un vistazo.' : 'Entiende mejor tu semana.'}</h1><p>{page === 'overview' ? 'Conoce tus gastos y decide qué es importante para ti.' : 'Revisa tus gastos de lunes a domingo.'}</p></div>{page === 'overview' && <button className="primary-button heading-add" onClick={() => { setEditing(null); document.getElementById('concept')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.getElementById('concept')?.focus({ preventScroll: true }); }} disabled={loading || !report}><Plus size={17} />Agregar gasto</button>}</div>
        <div className="week-toolbar"><div className="week-selector"><CalendarDays size={17} /><span>{report ? `${shortDate(report.start)} – ${shortDate(report.end)}, ${report.end.slice(0, 4)}` : 'Elige una semana'}</span><button aria-label="Semana anterior" disabled={loading || busy} onClick={() => setDate(moveWeek(date, -1))}><ChevronLeft size={17} /></button><button aria-label="Semana siguiente" disabled={loading || busy} onClick={() => setDate(moveWeek(date, 1))}><ChevronRight size={17} /></button></div><div className="week-actions"><button onClick={() => setDate(localToday())} disabled={loading || busy}>Esta semana</button><label className="date-picker-label">Ir a una fecha<input type="date" aria-label="Elige una fecha para el reporte" value={date} min="1900-01-01" max="9999-12-24" disabled={busy} onChange={event => { if (event.target.value) setDate(event.target.value); }} /></label></div></div>
        {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={refresh} disabled={loading}>Reintentar</button></div>}
        {notice && <div className="notice-banner" role="status"><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={16} /></button></div>}
        {loading && <p role="status" className="loading-label">Actualizando la semana…</p>}
        {report && <>
          <div className="stats-grid"><div className="stat-card"><div className="stat-label">Total de esta semana<span className="stat-icon green"><Wallet size={17} /></span></div><strong>{money(total)}</strong><span className="stat-caption"><span className="tiny-dot" />En {count} gastos</span></div><div className="stat-card"><div className="stat-label">Promedio diario<span className="stat-icon amber"><CalendarDays size={17} /></span></div><strong>{money(Math.round(total / 7))}</strong><span className="stat-caption">Promedio de los siete días</span></div><div className="stat-card"><div className="stat-label">Categoría principal<span className="stat-icon lavender"><ArrowDownLeft size={18} /></span></div><strong className="category-stat">{largest?.label ?? 'Aún sin gastos'}</strong><span className="stat-caption">{largest ? `${money(largest.totalCents)} · ${Math.round(largest.totalCents / total * 100)}% de tu semana` : 'Tu primer gasto inicia el registro'}</span></div></div>
          {page === 'overview' ? <div className="dashboard-grid"><div className="dashboard-left"><SpendingChart report={report} /><ExpenseList expenses={report.expenses} search={search} onSearch={setSearch} onDelete={setPendingDelete} onEdit={setEditing} busy={busy || loading} /></div><div className="dashboard-right"><ExpenseForm key={editing?.id ?? "new"} categories={categories} onSave={saveExpense} saving={busy || loading} editing={editing} onCancel={() => setEditing(null)} /><div className="weekly-prompt"><span className="icon-box"><ReceiptText size={19} /></span><h3>Ve tus gastos con más claridad.</h3><p>El reporte semanal reúne todos tus gastos, de lunes a domingo.</p><button onClick={() => setPage('report')}>Ver reporte semanal<ArrowUpRight size={16} /></button></div></div></div> : <WeeklyReport report={report} generated={generated} onGenerate={generateReport} busy={busy || loading} />}
          {allCount === 0 && <div className="demo-banner"><span><Sparkles size={16} />¿Quieres explorar antes de empezar?</span><button onClick={loadDemo} disabled={busy || loading}>Cargar semana de ejemplo <ArrowUpRight size={14} /></button></div>}
        </>}
        <footer><span className="flex items-center gap-1.5"><Leaf size={13} />Un poco más de claridad, a tu manera.</span><span>Penny · Gastos personales</span></footer>
      </main>
    </div>
    {help && <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="help-title" className="modal-card"><button autoFocus className="modal-close" onClick={() => setHelp(false)} aria-label="Cerrar ayuda"><X size={20} /></button><span className="icon-box"><Leaf size={24} /></span><h2 id="help-title">Un poco más de claridad con Penny.</h2><p>Agrega un concepto, importe y fecha. Penny sugiere una categoría; también puedes elegirla.</p><p>La gráfica y la lista muestran la semana de lunes a domingo que selecciones.</p><p>Abre el reporte semanal para consultar cada día o guardar un PDF. Los gastos {isNative ? 'se guardan en este teléfono' : 'se guardan en la computadora que ejecuta el servidor'}. Los importes se muestran en pesos mexicanos (MXN).</p><button className="primary-button" onClick={() => setHelp(false)}>Entendido</button></section></div>}
    {pendingDelete && <div className="modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="modal-card"><h2 id="delete-title">¿Eliminar este gasto?</h2><p>Se eliminará “{pendingDelete.concept}” ({money(pendingDelete.amountCents)}).</p><div className="flex gap-3 mt-6"><button autoFocus className="secondary-button" disabled={busy} onClick={() => setPendingDelete(null)}>Conservar gasto</button><button className="danger-button" disabled={busy} onClick={deleteExpense}>{busy ? 'Eliminando…' : 'Eliminar gasto'}</button></div></section></div>}
  </div>;
}
// PATTERN: MVC View ends here.
