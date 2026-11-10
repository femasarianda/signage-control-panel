import { useState } from 'react';
import { api } from '../lib/api.js';
import { Button, Field, Input, Modal, inputClass } from './ui.jsx';

const MODES = [
  { id: 'upload', label: 'Upload file' },
  { id: 'text', label: 'Teks' },
  { id: 'url', label: 'URL' },
];

/** Tambah content baru (upload/teks/URL) atau, jika `content` diberikan, ubah judul & isinya. */
export default function ContentFormModal({ content, onClose, onSaved }) {
  const editing = Boolean(content);
  const [mode, setMode] = useState(editing ? content.tipe : 'upload');
  const [judul, setJudul] = useState(content?.judul ?? '');
  const [payload, setPayload] = useState(content?.payload ?? '');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isFileType = mode === 'upload' || mode === 'image' || mode === 'video';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (editing) {
        await api.contents.update(content.id, { judul, ...(isFileType ? {} : { payload }) });
      } else if (mode === 'upload') {
        if (!file) throw new Error('Pilih file terlebih dahulu');
        await api.contents.upload(file, judul);
      } else {
        await api.contents.create({ judul, tipe: mode, payload });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit content' : 'Tambah content'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {!editing && (
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-2 p-1" role="tablist">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-md py-1.5 text-sm font-medium transition ${
                  mode === m.id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        <Field label="Judul">
          <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Opsional untuk upload" required={mode !== 'upload'} />
        </Field>

        {mode === 'upload' && !editing && (
          <Field label="File gambar / video (maks. 50 MB)">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files[0] ?? null)}
              className={`${inputClass} file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1 file:text-accent-fg`}
              required
            />
          </Field>
        )}
        {mode === 'text' && (
          <Field label="Isi teks">
            <textarea className={inputClass} rows={4} value={payload} onChange={(e) => setPayload(e.target.value)} required />
          </Field>
        )}
        {mode === 'url' && (
          <Field label="URL halaman web">
            <Input type="url" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="https://" required />
          </Field>
        )}

        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
