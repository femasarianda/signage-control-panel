import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, MonitorOff, MonitorSmartphone, Plus, RotateCw, Search, SearchX, Trash2, Wifi, WifiOff } from 'lucide-react';
import { api } from '../lib/api.js';
import { useDevices } from '../lib/useDevices.js';
import { useToast } from '../lib/toast.jsx';
import { useConfirm } from '../lib/confirm.jsx';
import { Button, EmptyState, ICON_STROKE, Input } from '../components/ui.jsx';
import DeviceCard, { DeviceCardSkeleton } from '../components/DeviceCard.jsx';
import DeviceFormModal from '../components/DeviceFormModal.jsx';
import PlaylistModal from '../components/PlaylistModal.jsx';
import PushModal from '../components/PushModal.jsx';

// URL halaman player (device-client). Bisa diubah lewat VITE_PLAYER_URL.
const PLAYER_URL = import.meta.env.VITE_PLAYER_URL || 'http://localhost:5174';

const FILTERS = [
  { id: 'all', label: 'Semua device', icon: MonitorSmartphone, tone: 'accent' },
  { id: 'online', label: 'Online', icon: Wifi, tone: 'online' },
  { id: 'offline', label: 'Offline', icon: WifiOff, tone: 'offline' },
];

const TONES = {
  accent: 'bg-accent-soft text-accent-ink',
  online: 'bg-online-soft text-online-ink',
  offline: 'bg-offline-soft text-offline-ink',
};

function StatFilter({ filter, count, total, active, onSelect }) {
  const { label, icon: Icon, tone, id } = filter;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`flex flex-col items-start gap-2 rounded-2xl border bg-surface p-3 text-left shadow-card transition-all sm:flex-row sm:items-center sm:gap-3
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-4 ${
          active ? 'border-accent ring-3 ring-accent/15' : 'border-line hover:border-line-strong'
        }`}
    >
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg sm:size-10 sm:rounded-xl ${TONES[tone]}`}>
        <Icon className="size-4 sm:size-5" strokeWidth={ICON_STROKE} aria-hidden />
      </span>
      <span className="min-w-0 max-w-full">
        <span className="block truncate text-xs font-medium text-muted sm:text-[13px]">{label}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold tabular-nums text-fg">{count}</span>
          {id !== 'all' && total > 0 && (
            <span className="hidden text-xs text-muted sm:inline">{Math.round((count / total) * 100)}%</span>
          )}
        </span>
      </span>
    </button>
  );
}

export default function Devices() {
  const toast = useToast();
  const confirm = useConfirm();
  const { devices, loading, error, live, refresh } = useDevices();
  const [contents, setContents] = useState([]);
  const [modal, setModal] = useState(null); // { type: 'form' | 'playlist' | 'push', device? }
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [, tick] = useState(0);

  useEffect(() => {
    api.contents.list().then(setContents).catch((err) => toast.error(err.message));
  }, [toast]);

  // Perbarui teks "x menit lalu" tiap 30 detik
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const online = devices.filter((d) => d.status === 'online').length;
    return { all: devices.length, online, offline: devices.length - online };
  }, [devices]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return devices.filter(
      (d) =>
        (filter === 'all' || d.status === filter) &&
        (!q || d.nama.toLowerCase().includes(q) || (d.lokasi ?? '').toLowerCase().includes(q)),
    );
  }, [devices, filter, query]);

  const close = () => setModal(null);
  const resetFilters = () => {
    setFilter('all');
    setQuery('');
  };

  const remove = (device) =>
    confirm({
      title: `Hapus device "${device.nama}"?`,
      message: 'Device beserta playlist-nya akan dihapus permanen. Layar yang memakai link device ini tidak akan menayangkan apa pun.',
      confirmLabel: 'Hapus device',
      icon: Trash2,
      tone: 'danger',
      onConfirm: async () => {
        try {
          await api.devices.remove(device.id);
          toast.success(`Device "${device.nama}" dihapus`);
          refresh();
        } catch (err) {
          toast.error(err.message);
          throw err;
        }
      },
    });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Devices</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                live ? 'bg-online-soft text-online-ink' : 'bg-danger-soft text-danger-ink'
              }`}
              role="status"
            >
              <span className={`size-1.5 rounded-full ${live ? 'pulse-online bg-online' : 'bg-danger'}`} aria-hidden />
              {live ? 'Real-time aktif' : 'Menyambung ulang…'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">Kelola layar signage dan pantau statusnya secara langsung.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="sm:w-72">
            <Input
              icon={Search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau lokasi…"
              aria-label="Cari device"
            />
          </div>
          <Button variant="primary" icon={Plus} onClick={() => setModal({ type: 'form' })}>Tambah device</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2.5 sm:gap-4" role="group" aria-label="Filter status device">
        {FILTERS.map((f) => (
          <StatFilter
            key={f.id}
            filter={f}
            count={counts[f.id]}
            total={counts.all}
            active={filter === f.id}
            onSelect={() => setFilter(f.id)}
          />
        ))}
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-ink" role="alert">
          <CircleAlert className="size-[18px] shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
          <span className="flex-1">{error}</span>
          <Button size="sm" icon={RotateCw} onClick={refresh}>Coba lagi</Button>
        </div>
      )}

      {loading ? (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Memuat device">
          {Array.from({ length: 6 }, (_, i) => <DeviceCardSkeleton key={i} />)}
        </ul>
      ) : devices.length === 0 ? (
        <EmptyState
          icon={MonitorOff}
          title="Belum ada device"
          action={<Button variant="primary" icon={Plus} onClick={() => setModal({ type: 'form' })}>Tambah device pertama</Button>}
        >
          Tambahkan device, lalu buka link player-nya di layar signage untuk mulai menayangkan content.
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="Tidak ada device yang cocok" action={<Button onClick={resetFilters}>Reset filter</Button>}>
          Coba kata kunci lain atau tampilkan semua status.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              playerUrl={PLAYER_URL}
              onPush={() => setModal({ type: 'push', device: d })}
              onPlaylist={() => setModal({ type: 'playlist', device: d })}
              onEdit={() => setModal({ type: 'form', device: d })}
              onDelete={() => remove(d)}
              onError={toast.error}
            />
          ))}
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
