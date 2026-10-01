import { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../localExpenseStore.js';

export default function BackupControls({ onChanged }) {
  const picker = useRef(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (!Capacitor.isNativePlatform()) return null;

  async function createBackup() {
    setBusy(true); setMessage('');
    try {
      const backup = await exportBackup();
      const bytes = new TextEncoder().encode(JSON.stringify(backup, null, 2));
      let binary = '';
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const encoded = btoa(binary);
      const name = `penny-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const file = await Filesystem.writeFile({ path: name, data: encoded, directory: Directory.Cache, recursive: true });
      await Share.share({ title: 'Respaldo de Penny', text: 'Guarda este archivo fuera del teléfono para poder recuperar tus gastos.', files: [file.uri], dialogTitle: 'Guardar respaldo de Penny' });
      setMessage(`Respaldo listo (${backup.expenses.length} gastos). Guarda una copia fuera del teléfono.`);
    } catch (error) { setMessage(error.message || 'No se pudo crear el respaldo.'); }
    finally { setBusy(false); }
  }

  async function readBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setMessage('');
    try {
      const input = JSON.parse(await file.text());
      const entries = Array.isArray(input) ? input : input?.expenses;
      if (!Array.isArray(entries)) throw new Error('El archivo no contiene gastos de Penny.');
      if (!window.confirm(`¿Importar este archivo? Revisaremos ${entries.length} gastos y omitiremos los que ya estén en el teléfono. Se conservarán los datos actuales.`)) return;
      const result = await importBackup(input);
      setMessage(`Importados ${result.imported} gastos; omitidos ${result.skipped} registros repetidos.`);
      await onChanged();
    } catch (error) { setMessage(error.message || 'No se pudo leer el archivo de respaldo.'); }
    finally { setBusy(false); event.target.value = ''; }
  }

  return <div className="backup-controls">
    <button className="backup-button" type="button" onClick={createBackup} disabled={busy}><Download size={15} />Respaldo</button>
    <button className="backup-button" type="button" onClick={() => picker.current?.click()} disabled={busy}><Upload size={15} />Importar</button>
    <input ref={picker} type="file" accept="application/json,.json" hidden onChange={readBackup} />
    {message && <span className="backup-message" role="status">{message}</span>}
  </div>;
}
