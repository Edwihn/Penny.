import { useRef, useState } from 'react';
import { ArrowUpRight, Pencil, Plus, Sparkles } from 'lucide-react';
import { localToday } from '../utils.js';

// PATTERN: MVC View — form input and feedback; creation rules belong to the backend.
export default function ExpenseForm({ categories, onSave, saving, editing, onCancel }) {
  const formRef = useRef(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    const input = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await onSave(input);
      if (!editing) {
        formRef.current?.reset();
        setSuccess('Expense saved. Your spending is up to date.');
      }
    } catch (failure) { setError(failure.message); }
  }

  return <section className="panel expense-form" aria-labelledby="add-heading">
    <div className="section-title"><span className="icon-box">{editing ? <Pencil size={19} /> : <Plus size={19} />}</span><h2 id="add-heading">{editing ? 'Edit expense' : 'Add an expense'}</h2></div>
    <p className="section-description">{editing ? 'Update the details. Your totals will follow.' : 'Small details. A clearer picture.'}</p>
    <form onSubmit={submit} ref={formRef}>
      <label htmlFor="concept">What was it for?</label>
      <input id="concept" name="concept" defaultValue={editing?.concept ?? ''} placeholder="e.g. Coffee with friends" required maxLength={100} autoComplete="off" />
      <div className="grid grid-cols-2 gap-3">
        <div><label htmlFor="amount">Amount</label><div className="amount-input"><span>$</span><input id="amount" name="amount" aria-label="Amount" type="number" defaultValue={editing ? (editing.amountCents / 100).toFixed(2) : ''} placeholder="0.00" min="0.01" max="1000000" step="0.01" required /></div></div>
        <div><label htmlFor="date">Date</label><input id="date" name="date" type="date" min="1900-01-01" max="9999-12-31" defaultValue={editing?.date ?? localToday()} required /></div>
      </div>
      <label htmlFor="category">Category</label>
      <select id="category" name="category" defaultValue={editing?.category ?? 'auto'}><option value="auto">Auto-detect from name</option>{categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select>
      <p className="input-hint"><Sparkles size={12} /> We’ll find a category for you.</p>
      <label htmlFor="reason">A little context <span className="font-normal text-stone-500">(optional)</span></label>
      <textarea id="reason" name="reason" defaultValue={editing?.reason ?? ''} rows={3} maxLength={500} placeholder="A note for your future self…" />
      {error && <p role="alert" className="form-error">{error}</p>}
      {success && <p role="status" className="form-success">{success}</p>}
      <button type="submit" className="primary-button w-full justify-center mt-5" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Save expense'}<ArrowUpRight size={17} /></button>
      {editing && <button type="button" className="secondary-button w-full justify-center mt-3" onClick={onCancel} disabled={saving}>Cancel editing</button>}
      <p className="form-footnote">Every little expense counts.</p>
    </form>
  </section>;
}
