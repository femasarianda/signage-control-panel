const TYPE_LABEL = { image: 'Gambar', video: 'Video', text: 'Teks', url: 'Halaman web' };
export const typeLabel = (tipe) => TYPE_LABEL[tipe] || tipe;

/** Pratinjau kecil sesuai tipe content. */
export default function ContentPreview({ content, className = '' }) {
  const base = `overflow-hidden bg-surface-2 ${className}`;

  if (content.tipe === 'image') {
    return <img src={content.payload} alt={content.judul} loading="lazy" className={`${base} object-cover`} />;
  }
  if (content.tipe === 'video') {
    return <video src={content.payload} muted preload="metadata" className={`${base} object-cover`} />;
  }
  if (content.tipe === 'text') {
    return (
      <div className={`${base} flex items-center justify-center p-3 text-center text-sm text-fg`}>
        <span className="line-clamp-4">{content.payload}</span>
      </div>
    );
  }
  return (
    <div className={`${base} flex flex-col items-center justify-center gap-1 p-3 text-center`}>
      <span className="text-2xl" aria-hidden>🌐</span>
      <span className="line-clamp-1 max-w-full break-all font-mono text-xs text-muted">{content.payload}</span>
    </div>
  );
}
