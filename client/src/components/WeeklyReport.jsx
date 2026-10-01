import { useState } from 'react';
import { Download, CalendarCheck2 } from 'lucide-react';
import { money, shortDate, weekday } from '../utils.js';
import { downloadReportPdf } from '../reportPdf.js';

export default function WeeklyReport({ report, generated, onGenerate, busy }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  async function download() {
    setDownloading(true); setError('');
    try { await downloadReportPdf(report); }
    catch { setError('No se pudo crear el PDF. Inténtalo de nuevo.'); }
    finally { setDownloading(false); }
  }
  const max = Math.max(1, ...report.days.map(day => day.totalCents));
  return <section className="panel report-panel">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2>Tu semana, día por día</h2><p className="section-description">De lunes a domingo, con todos tus gastos.</p></div><button className="secondary-button" onClick={onGenerate} disabled={busy}><CalendarCheck2 size={16} />{busy ? 'Generando…' : 'Generar reporte semanal'}</button></div>
    <div className="report-banner"><CalendarCheck2 size={20} /><p>{generated ? `Reporte generado para el domingo ${shortDate(report.end)}.` : `Vista previa de la semana que termina el ${shortDate(report.end)}.`}<span>Este reporte se genera cuando lo solicitas.</span></p></div>
    <div className="daily-list">{report.days.map(day => <section className="daily-section" key={day.date} aria-label={`Gastos del ${day.date}`}>
      <div className="daily-row"><div><strong>{weekday(day.date)}</strong><span>{shortDate(day.date)}</span></div><div className="daily-bar"><div style={{ width: `${day.totalCents / max * 100}%` }} /></div><span className="daily-count">{day.count} gastos</span><strong>{money(day.totalCents)}</strong></div>
      {day.expenses.length ? <ul className="daily-expenses">{day.expenses.map(expense => <li key={expense.id}><span className="category-dot" style={{ backgroundColor: expense.color }} /><div><strong>{expense.concept}</strong><span>{expense.categoryLabel}</span>{expense.reason && <p>{expense.reason}</p>}</div><strong>{money(expense.amountCents)}</strong></li>)}</ul> : <p className="day-empty">No hay gastos registrados.</p>}
      <div className="daily-subtotal">Subtotal del día <strong>{money(day.totalCents)}</strong></div>
    </section>)}</div>
    <div className="report-total"><span>Total de la semana <small>{report.expenses.length} gastos</small></span><strong>{money(report.totalCents)}</strong></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="primary-button mt-6" onClick={download} disabled={busy || downloading}><Download size={16} />{downloading ? 'Preparando PDF…' : 'Descargar reporte (.pdf)'}</button>
  </section>;
}
