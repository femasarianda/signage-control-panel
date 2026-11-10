import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useDevices } from '../lib/useDevices.js';
import { useToast } from '../lib/toast.jsx';
import { Button, EmptyState, StatusBadge, timeAgo } from '../components/ui.jsx';
import DeviceFormModal from '../components/DeviceFormModal.jsx';
import PlaylistModal from '../components/PlaylistModal.jsx';
import PushModal from '../components/PushModal.jsx';

// URL halaman player (device-client). Bisa diubah lewat VITE_PLAYER_URL.
const PLAYER_URL = import.meta.env.VITE_PLAYER_URL || 'http://localhost:5174';

export default function Devices() {
  const toast = useToast();
  const { devices, loading, error, live, refresh } = useDevices();
  const [contents, setContents] = useState([]);
  const [modal, setModal] = useState(null); // { type: 'form' | 'playlist' | 'push', device? }
  const [, tick] = useState(0);

  useEffect(() => {
    api.contents.list().then(setContents).catch((err) => toast.error(err.message));
  }, [toast]);

  // Perbarui teks "x menit lalu" tiap 30 detik
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const close = () => setModal(null);
  const onlineCount = devices.filter((d) => d.status === 'online').length;

  const remove = async (device) => {
    if (!confirm(`Hapus device "${device.nama}"?`)) return;
    try {
      await api.devices.remove(device.id);
      toast.success('Device dihapus');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyLink = async (device) => {
    await navigator.clipboard.writeText(`${PLAYER_URL}/?device=${device.id}`);
    toast.success('Link player disalin');
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Devices</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span>{onlineCount} online dari {devices.length} device</span>
            <span aria-hidden>·</span>
            <span className={`inline-flex items-center gap-1.5 ${live ? 'text-online' : 'text-danger'}`}>
              <span className="size-1.5 rounded-full bg-current" />
              {live ? 'Live' : 'Menyambung ulang…'}
            </span>
          </p>
        </div>
        <Button variant="primary" onClick={() => setModal({ type: 'form' })}>+ Tambah device</Button>
      </div>

      {error && <p className="mb-4 text-sm text-danger" role="alert">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted">Memuat…</p>
      ) : devices.length === 0 ? (
        <EmptyState>Belum ada device. Klik “Tambah device” untuk memulai.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => {
            const online = d.status === 'online';
            return (
              <li key={d.id} className="flex flex-col rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{d.nama}</h2>
                    <p className="truncate text-sm text-muted">{d.lokasi || 'Lokasi belum diisi'}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-3 text-xs text-muted">
                  {online ? 'Terhubung sekarang' : `Terakhir terlihat: ${timeAgo(d.last_seen)}`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="primary" className="px-3 py-1.5" disabled={!online} onClick={() => setModal({ type: 'push', device: d })}>
                    Push
                  </Button>
                  <Button className="px-3 py-1.5" onClick={() => setModal({ type: 'playlist', device: d })}>Playlist</Button>
                  <Button variant="ghost" className="px-3 py-1.5" onClick={() => copyLink(d)}>Salin link</Button>
                </div>
                <div className="mt-3 flex gap-1 border-t border-line pt-3">
                  <Button variant="ghost" className="px-2.5 py-1 text-xs" onClick={() => setModal({ type: 'form', device: d })}>Edit</Button>
                  <Button variant="ghost" className="px-2.5 py-1 text-xs text-danger" onClick={() => remove(d)}>Hapus</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal?.type === 'form' && (
        <DeviceFormModal
          device={modal.device}
          onClose={close}
          onSaved={() => {
            close();
            refresh();
            toast.success('Device disimpan');
          }}
        />
      )}
      {modal?.type === 'playlist' && <PlaylistModal device={modal.device} contents={contents} onClose={close} />}
      {modal?.type === 'push' && <PushModal device={modal.device} contents={contents} onClose={close} />}
    </div>
  );
}
