import { useRef, useState } from 'react';
import { ArrowUpRight, Pencil, Plus, Sparkles } from 'lucide-react';
import { localToday } from '../utils.js';

// PATTERN: MVC View — form input and feedback; creation rules belong to the data layer.
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
        setSuccess('Gasto guardado. Tus datos están actualizados.');
      }
    } catch (failure) { setError(failure.message); }
  }

  return <section className="panel expense-form" aria-labelledby="add-heading">
    <div className="section-title"><span className="icon-box">{editing ? <Pencil size={19} /> : <Plus size={19} />}</span><h2 id="add-heading">{editing ? 'Editar gasto' : 'Agregar un gasto'}</h2></div>
    <p className="section-description">{editing ? 'Actualiza los datos y verás los nuevos totales.' : 'Cada detalle te ayuda a entender mejor.'}</p>
    <form onSubmit={submit} ref={formRef}>
      <label htmlFor="concept">¿En qué gastaste?</label>
      <input id="concept" name="concept" defaultValue={editing?.concept ?? ''} placeholder="Ej. Café con amigos" required maxLength={100} autoComplete="off" />
      <div className="grid grid-cols-2 gap-3">
        <div><label htmlFor="amount">Importe (MXN)</label><div className="amount-input"><span>$</span><input id="amount" name="amount" aria-label="Importe en pesos mexicanos" type="number" defaultValue={editing ? (editing.amountCents / 100).toFixed(2) : ''} placeholder="0.00" min="0.01" max="1000000" step="0.01" required /></div></div>
        <div><label htmlFor="date">Fecha</label><input id="date" name="date" type="date" min="1900-01-01" max="9999-12-31" defaultValue={editing?.date ?? localToday()} required /></div>
      </div>
      <label htmlFor="category">Categoría</label>
      <select id="category" name="category" defaultValue={editing?.category ?? 'auto'}><option value="auto">Detectar automáticamente</option>{categories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}</select>
      <p className="input-hint"><Sparkles size={12} /> Elegiremos una categoría según el concepto.</p>
      <label htmlFor="reason">Nota <span className="font-normal text-stone-500">(opcional)</span></label>
      <textarea id="reason" name="reason" defaultValue={editing?.reason ?? ''} rows={3} maxLength={500} placeholder="Agrega un detalle para recordarlo…" />
      {error && <p role="alert" className="form-error">{error}</p>}
      {success && <p role="status" className="form-success">{success}</p>}
      <button type="submit" className="primary-button w-full justify-center mt-5" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar gasto'}<ArrowUpRight size={17} /></button>
      {editing && <button type="button" className="secondary-button w-full justify-center mt-3" onClick={onCancel} disabled={saving}>Cancelar edición</button>}
      <p className="form-footnote">Cada gasto cuenta.</p>
    </form>
  </section>;
}
