import { useEffect, useRef, useState } from 'react';
import { Check, Clock, Copy, ListVideo, MapPin, MonitorOff, MonitorPlay, Pencil, Send, Trash2 } from 'lucide-react';
import { Button, ICON_STROKE, Menu, Skeleton, StatusBadge, Tooltip, timeAgo } from './ui.jsx';

/** Salin teks ke clipboard; fallback untuk konteks non-HTTPS di mana navigator.clipboard tidak tersedia. */
async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const el = Object.assign(document.createElement('textarea'), { value: text });
  el.style.cssText = 'position:fixed;opacity:0';
  document.body.append(el);
  el.select();
  const ok = document.execCommand('copy');
  el.remove();
  if (!ok) throw new Error('Gagal menyalin link');
}

function CopyLinkButton({ url, onError }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await copyText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <Tooltip text={copied ? 'Tersalin!' : 'Salin link player'} show={copied}>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Link tersalin' : 'Salin link player'}
        className={`grid size-9 place-items-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          copied ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-surface-2 hover:text-fg'
        }`}
      >
        {copied ? (
          <Check className="size-[18px]" strokeWidth={2} aria-hidden />
        ) : (
          <Copy className="size-[18px]" strokeWidth={ICON_STROKE} aria-hidden />
        )}
      </button>
    </Tooltip>
  );
}

/** Area pratinjau 16:9: menggambarkan kondisi layar device secara visual. */
function ScreenPreview({ device }) {
  const online = device.status === 'online';
  return (
    <div className={`relative aspect-video overflow-hidden rounded-t-2xl ${online ? 'screen-online' : 'screen-offline'}`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
        {online ? (
          <>
            <MonitorPlay className="size-9 text-white/85" strokeWidth={1.5} aria-hidden />
            <span className="text-xs font-medium text-white/70">Layar aktif menayangkan playlist</span>
          </>
        ) : (
          <>
            <MonitorOff className="size-9 text-offline" strokeWidth={1.5} aria-hidden />
            <span className="text-xs font-medium text-muted">Tidak ada sinyal</span>
          </>
        )}
      </div>
      <StatusBadge status={device.status} className="absolute top-3 left-3 shadow-sm" />
      {online && (
        <span className="absolute right-3 bottom-3 rounded bg-black/35 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-white/80">
          LIVE
        </span>
      )}
    </div>
  );
}

export default function DeviceCard({ device, playerUrl, onPush, onPlaylist, onEdit, onDelete, onError }) {
  const online = device.status === 'online';

  return (
    <li className="flex flex-col rounded-2xl border border-line bg-surface shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <ScreenPreview device={device} />

      <div className="flex-1 px-4 pt-3.5 pb-3">
        <h2 className="truncate text-[15px] font-semibold text-fg" title={device.nama}>{device.nama}</h2>
        <dl className="mt-2 space-y-1.5 text-[13px] text-muted">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Lokasi</dt>
            <MapPin className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
            <dd className={`truncate ${device.lokasi ? '' : 'text-muted/70'}`}>{device.lokasi || 'Lokasi belum diisi'}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Terakhir dilihat</dt>
            <Clock className="size-3.5 shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
            <dd className="truncate">
              {online ? (
                <span className="font-medium text-online-ink">Terhubung sekarang</span>
              ) : device.last_seen ? (
                <>Terakhir dilihat {timeAgo(device.last_seen).toLowerCase()}</>
              ) : (
                'Belum pernah terhubung'
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
        {online ? (
          <Button variant="primary" size="sm" icon={Send} onClick={onPush}>Push</Button>
        ) : (
          <Tooltip text="Device harus online untuk push">
            <Button variant="primary" size="sm" icon={Send} disabled>Push</Button>
          </Tooltip>
        )}
        <Button size="sm" icon={ListVideo} onClick={onPlaylist}>Playlist</Button>

        <div className="ml-auto flex items-center">
          <CopyLinkButton url={`${playerUrl}/?device=${device.id}`} onError={onError} />
          <Menu
            label={`Aksi lainnya untuk ${device.nama}`}
            items={[
              { label: 'Edit device', icon: Pencil, onSelect: onEdit },
              'divider',
              { label: 'Hapus device', icon: Trash2, onSelect: onDelete, tone: 'danger' },
            ]}
          />
        </div>
      </div>
    </li>
  );
}

export function DeviceCardSkeleton() {
  return (
    <li className="rounded-2xl border border-line bg-surface shadow-card" aria-hidden>
      <Skeleton className="aspect-video rounded-t-2xl rounded-b-none" />
      <div className="space-y-2.5 px-4 pt-4 pb-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="flex gap-2 border-t border-line px-3 py-2.5">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </li>
  );
}
