import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Inbox, ListVideo, Plus, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Button, EmptyState, IconButton, Skeleton, Modal } from './ui.jsx';
import ContentPreview, { TypeTag } from './ContentPreview.jsx';

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
  const totalSec = (items ?? []).reduce((sum, it) => sum + (Number(it.duration_sec) || 0), 0);

  const sectionTitle = 'mb-2.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted';

  return (
    <Modal
      title={`Playlist · ${device.nama}`}
      description="Atur urutan dan durasi tayang content untuk device ini."
      icon={ListVideo}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={save} loading={busy} disabled={items === null}>Simpan playlist</Button>
        </>
      }
    >
      {items === null ? (
        <div className="grid gap-5 md:grid-cols-2" aria-busy="true">
          {[0, 1].map((col) => (
            <div key={col} className="space-y-2">
              <Skeleton className="mb-3 h-3 w-28" />
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <section>
            <h3 className={sectionTitle}>
              <span>Urutan tayang ({items.length})</span>
              {items.length > 0 && <span className="font-medium normal-case tracking-normal">Total {totalSec} detik</span>}
            </h3>
            {items.length === 0 ? (
              <EmptyState icon={ListVideo} title="Playlist kosong">Tambahkan content dari daftar di samping.</EmptyState>
            ) : (
              <ol className="space-y-2">
                {items.map((item, i) => {
                  const c = byId[item.content_id];
                  if (!c) return null;
                  return (
                    <li key={item.content_id} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 p-2">
                      <span className="w-5 text-center font-mono text-xs font-semibold text-muted">{i + 1}</span>
                      <ContentPreview content={c} className="size-10 shrink-0 rounded-lg" compact />
                      <span className="min-w-0 flex-1 truncate text-sm text-fg">{c.judul}</span>
                      <label className="flex items-center gap-1 text-xs text-muted">
                        <input
                          type="number"
                          min="1"
                          value={item.duration_sec}
                          onChange={(e) => setDuration(i, e.target.value)}
                          aria-label={`Durasi ${c.judul} (detik)`}
                          className="w-14 rounded-md border border-line-strong bg-surface px-1.5 py-1 text-center text-sm text-fg focus:border-accent focus:outline-none"
                        />
                        dtk
                      </label>
                      <div className="flex">
                        <IconButton icon={ChevronUp} label="Naikkan" tooltip={false} className="size-7" onClick={() => move(i, -1)} disabled={i === 0} />
                        <IconButton icon={ChevronDown} label="Turunkan" tooltip={false} className="size-7" onClick={() => move(i, 1)} disabled={i === items.length - 1} />
                        <IconButton
                          icon={X}
                          label="Hapus dari playlist"
                          tone="danger"
                          tooltip={false}
                          className="size-7"
                          onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section>
            <h3 className={sectionTitle}>Content tersedia ({available.length})</h3>
            {available.length === 0 ? (
              <EmptyState icon={Inbox} title={contents.length ? 'Semua sudah masuk' : 'Belum ada content'}>
                {contents.length ? 'Semua content sudah ada di playlist.' : 'Tambahkan content di menu Contents.'}
              </EmptyState>
            ) : (
              <ul className="space-y-2">
                {available.map((c) => (
                  <li key={c.id} className="flex items-center gap-2.5 rounded-xl border border-line p-2">
                    <ContentPreview content={c} className="size-10 shrink-0 rounded-lg" compact />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-fg">{c.judul}</p>
                      <TypeTag tipe={c.tipe} className="mt-0.5" />
                    </div>
                    <Button size="sm" icon={Plus} onClick={() => setItems([...items, { content_id: c.id, duration_sec: 10 }])}>
                      Tambah
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}
