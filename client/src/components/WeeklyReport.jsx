import { useState } from 'react';
import { Download, CalendarCheck2 } from 'lucide-react';
import { money, shortDate } from '../utils.js';
import { downloadReportPdf } from '../reportPdf.js';

export default function WeeklyReport({ report, generated, onGenerate, busy }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  async function download() {
    setDownloading(true); setError('');
    try { await downloadReportPdf(report); }
    catch { setError('The PDF could not be generated. Please try again.'); }
    finally { setDownloading(false); }
  }
  const max = Math.max(1, ...report.days.map(day => day.totalCents));
  return <section className="panel report-panel">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2>Your week, day by day</h2><p className="section-description">Monday through Sunday. Every expense accounted for.</p></div><button className="secondary-button" onClick={onGenerate} disabled={busy}><CalendarCheck2 size={16} />{busy ? 'Generating…' : 'Simulate Sunday report'}</button></div>
    <div className="report-banner"><CalendarCheck2 size={20} /><p>{generated ? `Report generated for Sunday, ${shortDate(report.end)}.` : `Preview for the week ending Sunday, ${shortDate(report.end)}.`}<span>This is a manual simulation. No background schedule is required.</span></p></div>
    <div className="daily-list">{report.days.map(day => <section className="daily-section" key={day.date} aria-label={`Expenses for ${day.date}`}>
      <div className="daily-row"><div><strong>{day.formattedDate.split(' ')[1]}</strong><span>{shortDate(day.date)}</span></div><div className="daily-bar"><div style={{ width: `${day.totalCents / max * 100}%` }} /></div><span className="daily-count">{day.count} expenses</span><strong>{money(day.totalCents)}</strong></div>
      {day.expenses.length ? <ul className="daily-expenses">{day.expenses.map(expense => <li key={expense.id}><span className="category-dot" style={{ backgroundColor: expense.color }} /><div><strong>{expense.concept}</strong><span>{expense.categoryLabel}</span>{expense.reason && <p>{expense.reason}</p>}</div><strong>{money(expense.amountCents)}</strong></li>)}</ul> : <p className="day-empty">No expenses recorded.</p>}
      <div className="daily-subtotal">Daily subtotal <strong>{money(day.totalCents)}</strong></div>
    </section>)}</div>
    <div className="report-total"><span>Weekly total <small>{report.expenses.length} expenses</small></span><strong>{money(report.totalCents)}</strong></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button className="primary-button mt-6" onClick={download} disabled={busy || downloading}><Download size={16} />{downloading ? 'Preparing PDF…' : 'Download report (.pdf)'}</button>
  </section>;
}
