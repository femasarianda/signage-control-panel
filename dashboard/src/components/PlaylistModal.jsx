import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Button, EmptyState, Modal } from './ui.jsx';
import ContentPreview, { typeLabel } from './ContentPreview.jsx';

export default function PlaylistModal({ device, contents, onClose }) {
  const toast = useToast();
  const [items, setItems] = useState(null); // [{ content_id, duration_sec }]
  const [busy, setBusy] = useState(false);
  const byId = Object.fromEntries(contents.map((c) => [c.id, c]));

  useEffect(() => {
    api.devices
      .playlist(device.id)
      .then((rows) => setItems(rows.map((r) => ({ content_id: r.id, duration_sec: r.duration_sec }))))
      .catch((err) => toast.error(err.message));
  }, [device.id, toast]);

  const move = (index, delta) =>
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const setDuration = (index, value) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, duration_sec: value } : it)));

  const save = async () => {
    setBusy(true);
    try {
      await api.devices.savePlaylist(
        device.id,
        items.map((it) => ({ ...it, duration_sec: Number(it.duration_sec) || 10 })),
      );
      toast.success('Playlist disimpan');
      onClose();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const inList = new Set((items ?? []).map((i) => i.content_id));
  const available = contents.filter((c) => !inList.has(c.id));

  return (
    <Modal title={`Playlist · ${device.nama}`} onClose={onClose} wide>
      {items === null ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Urutan tayang ({items.length})
            </h3>
            {items.length === 0 ? (
              <EmptyState>Playlist kosong. Tambahkan content dari daftar di samping.</EmptyState>
            ) : (
              <ol className="space-y-2">
                {items.map((item, i) => {
                  const c = byId[item.content_id];
                  if (!c) return null;
                  return (
                    <li key={item.content_id} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 p-2">
                      <span className="w-5 text-center font-mono text-xs text-muted">{i + 1}</span>
                      <ContentPreview content={c} className="size-10 shrink-0 rounded" />
                      <span className="min-w-0 flex-1 truncate text-sm">{c.judul}</span>
                      <input
                        type="number"
                        min="1"
                        value={item.duration_sec}
                        onChange={(e) => setDuration(i, e.target.value)}
                        aria-label={`Durasi ${c.judul} (detik)`}
                        className="w-14 rounded border border-line bg-surface px-1.5 py-1 text-center text-sm"
                      />
                      <span className="text-xs text-muted">dtk</span>
                      <Button variant="ghost" className="px-2 py-1" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan">↑</Button>
                      <Button variant="ghost" className="px-2 py-1" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Turunkan">↓</Button>
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-danger"
                        onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                        aria-label="Hapus dari playlist"
                      >
                        ✕
                      </Button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Content tersedia</h3>
            {available.length === 0 ? (
              <EmptyState>Semua content sudah masuk playlist.</EmptyState>
            ) : (
              <ul className="space-y-2">
                {available.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 rounded-lg border border-line p-2">
                    <ContentPreview content={c} className="size-10 shrink-0 rounded" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{c.judul}</p>
                      <p className="text-xs text-muted">{typeLabel(c.tipe)}</p>
                    </div>
                    <Button
                      className="px-2.5 py-1"
                      onClick={() => setItems([...items, { content_id: c.id, duration_sec: 10 }])}
                    >
                      + Tambah
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <Button onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={save} disabled={busy || items === null}>Simpan playlist</Button>
      </div>
    </Modal>
  );
}
