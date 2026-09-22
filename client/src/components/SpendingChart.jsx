import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { money } from '../utils.js';

// MVC View: segment angles use backend totals; colors come from ExpenseFactory.
export default function SpendingChart({ report }) {
  const categories = report?.categories ?? [];
  const total = report?.totalCents ?? 0;
  return <section className="panel chart-panel" aria-labelledby="breakdown-heading">
    <div className="flex items-center justify-between gap-3"><h2 id="breakdown-heading">Where your money goes</h2><span className="subtle-tag">By category</span></div>
    <p className="section-description">A little perspective on your week.</p>
    <div className="chart-content">
      <div className="donut-wrap" role="img" aria-label={total ? `Expense breakdown. Total ${money(total)}. Category amounts are listed alongside the chart.` : 'No expenses in this week yet.'}>
        {total > 0 ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="totalCents" nameKey="label" innerRadius="73%" outerRadius="95%" paddingAngle={3} stroke="none" isAnimationActive={false}>{categories.map(category => <Cell key={category.id} fill={category.color} />)}</Pie><Tooltip formatter={value => money(value)} contentStyle={{ borderRadius: 12, border: '1px solid var(--border, #e5e8e2)', background: 'var(--surface, #fff)', color: 'var(--text, #293d34)', fontSize: 12 }} /></PieChart></ResponsiveContainer> : <div className="empty-donut" />}
        <div className="donut-center"><span>WEEKLY TOTAL</span><strong>{money(total)}</strong><small>{report?.expenses.length ?? 0} expenses</small></div>
      </div>
      <div className="chart-legend">
        {categories.length ? categories.map(category => <div key={category.id} className="legend-row"><span className="category-dot" style={{ backgroundColor: category.color }} /><div className="grow"><span className="legend-name">{category.label}</span><div className="legend-track"><div style={{ backgroundColor: category.color, width: `${category.totalCents / total * 100}%` }} /></div></div><div className="text-right"><strong>{money(category.totalCents)}</strong><small>{Math.round(category.totalCents / total * 100)}%</small></div></div>) : <div className="text-sm text-stone-500 leading-6"><strong className="block text-stone-700 font-medium mb-1">Your week starts here.</strong>Add your first expense to see your spending take shape.</div>}
      </div>
    </div>
    <div className="chart-note"><span className="tiny-dot" /> One color per category. One clearer picture.</div>
  </section>;
}
