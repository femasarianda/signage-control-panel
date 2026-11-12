import { useId, useState } from 'react';
import { FileText, Link, Pencil, Plus, Type, Upload } from 'lucide-react';
import { api } from '../lib/api.js';
import { Button, Field, ICON_STROKE, Input, Modal, inputClass } from './ui.jsx';

const MODES = [
  { id: 'upload', label: 'Upload file', icon: Upload },
  { id: 'text', label: 'Teks', icon: Type },
  { id: 'url', label: 'URL', icon: Link },
];

/** Tambah content baru (upload/teks/URL) atau, jika `content` diberikan, ubah judul & isinya. */
export default function ContentFormModal({ content, onClose, onSaved }) {
  const formId = useId();
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
    <Modal
      title={editing ? 'Edit content' : 'Tambah content'}
      description={editing ? 'Perbarui judul atau isi content.' : 'Upload gambar/video, atau tambahkan teks dan halaman web.'}
      icon={editing ? Pencil : Plus}
      onClose={onClose}
      footer={
        <>
          <Button type="button" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" form={formId} loading={busy}>
            {busy && mode === 'upload' ? 'Mengunggah…' : 'Simpan'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {!editing && (
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1" role="tablist" aria-label="Jenis content">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  mode === m.id ? 'bg-surface text-accent-ink shadow-card' : 'text-muted hover:text-fg'
                }`}
              >
                <m.icon className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
                {m.label}
              </button>
            ))}
          </div>
        )}

        <Field label="Judul" hint={mode === 'upload' ? 'Opsional. Jika kosong, nama file dipakai.' : undefined}>
          <Input icon={FileText} value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="mis. Promo akhir tahun" required={mode !== 'upload'} />
        </Field>

        {mode === 'upload' && !editing && (
          <Field label="File gambar / video" hint="Maksimal 50 MB.">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files[0] ?? null)}
              className={`${inputClass} cursor-pointer py-1.5 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-ink`}
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
          <Field label="URL halaman web" hint="Beberapa situs (mis. Google, YouTube) melarang ditampilkan di dalam halaman lain.">
            <Input icon={Link} type="url" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="https://" required />
          </Field>
        )}

        {error && <p className="text-sm text-danger-ink" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
