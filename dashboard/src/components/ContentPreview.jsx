import { Globe, Image, Type, Video } from 'lucide-react';
import { ICON_STROKE } from './ui.jsx';

export const CONTENT_TYPES = {
  image: { label: 'Gambar', icon: Image },
  video: { label: 'Video', icon: Video },
  text: { label: 'Teks', icon: Type },
  url: { label: 'Halaman web', icon: Globe },
};
export const typeLabel = (tipe) => CONTENT_TYPES[tipe]?.label || tipe;

/** Label tipe content dengan ikon. */
export function TypeTag({ tipe, className = '' }) {
  const Icon = CONTENT_TYPES[tipe]?.icon ?? Globe;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted ${className}`}>
      <Icon className="size-3" strokeWidth={ICON_STROKE} aria-hidden />
      {typeLabel(tipe)}
    </span>
  );
}

/** Pratinjau sesuai tipe content. `compact` untuk thumbnail kecil di daftar. */
export default function ContentPreview({ content, className = '', compact = false }) {
  const base = `overflow-hidden bg-surface-2 ${className}`;

  if (content.tipe === 'image') {
    return <img src={content.payload} alt={content.judul} loading="lazy" className={`${base} object-cover`} />;
  }
  if (content.tipe === 'video') {
    return (
      <div className={`${base} relative`}>
        <video src={content.payload} muted preload="metadata" className="size-full object-cover" />
        <span className="absolute right-1.5 bottom-1.5 grid size-5 place-items-center rounded bg-black/50 text-white">
          <Video className="size-3" strokeWidth={2} aria-hidden />
        </span>
      </div>
    );
  }
  if (content.tipe === 'text') {
    return compact ? (
      <div className={`${base} grid place-items-center text-accent-ink`}>
        <Type className="size-5" strokeWidth={ICON_STROKE} aria-hidden />
      </div>
    ) : (
      <div className={`${base} flex items-center justify-center p-4 text-center text-sm leading-relaxed text-fg`}>
        <span className="line-clamp-4">{content.payload}</span>
      </div>
    );
  }
  return (
    <div className={`${base} flex flex-col items-center justify-center gap-2 p-3 text-center text-accent-ink`}>
      <Globe className={compact ? 'size-5' : 'size-8'} strokeWidth={ICON_STROKE} aria-hidden />
      {!compact && <span className="line-clamp-1 max-w-full break-all font-mono text-xs text-muted">{content.payload}</span>}
    </div>
  );
}
