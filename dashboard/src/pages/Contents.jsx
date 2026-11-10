import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Button, EmptyState } from '../components/ui.jsx';
import ContentPreview, { typeLabel } from '../components/ContentPreview.jsx';
import ContentFormModal from '../components/ContentFormModal.jsx';

export default function Contents() {
  const toast = useToast();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { content? }

  const load = useCallback(async () => {
    try {
      setContents(await api.contents.list());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (c) => {
    if (!confirm(`Hapus content "${c.judul}"? Content juga dilepas dari semua playlist.`)) return;
    try {
      await api.contents.remove(c.id);
      toast.success('Content dihapus');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Contents</h1>
          <p className="mt-1 text-sm text-muted">{contents.length} content tersimpan</p>
        </div>
        <Button variant="primary" onClick={() => setModal({})}>+ Tambah content</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : contents.length === 0 ? (
        <EmptyState>Belum ada content. Upload gambar/video, atau tambahkan teks dan URL.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contents.map((c) => (
            <li key={c.id} className="overflow-hidden rounded-xl border border-line bg-surface">
              <ContentPreview content={c} className="h-36 w-full" />
              <div className="p-3">
                <p className="truncate font-medium">{c.judul}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {typeLabel(c.tipe)} · {new Date(c.created_at).toLocaleDateString('id-ID')}
                </p>
                <div className="mt-3 flex gap-1">
                  <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setModal({ content: c })}>Edit</Button>
                  <Button variant="ghost" className="px-2.5 py-1 text-xs text-danger" onClick={() => remove(c)}>Hapus</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <ContentFormModal
          content={modal.content}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
            toast.success('Content disimpan');
          }}
        />
      )}
    </div>
  );
}
