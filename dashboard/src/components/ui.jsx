import { useEffect } from 'react';

const BUTTON_STYLES = {
  primary: 'bg-accent text-accent-fg hover:opacity-90',
  secondary: 'bg-surface-2 text-fg border border-line hover:border-muted',
  danger: 'bg-transparent text-danger border border-line hover:border-danger',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
};

export function Button({ variant = 'secondary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition
        disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-muted ' +
  'focus:border-accent focus:outline-none';

export function Input(props) {
  return <input className={inputClass} {...props} />;
}

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl border border-line bg-surface shadow-2xl ${
          wide ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="text-muted hover:text-fg">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const online = status === 'online';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium ${
        online ? 'text-online' : 'text-offline'
      }`}
    >
      <span className={`size-2 rounded-full bg-current ${online ? 'pulse-online' : ''}`} />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function timeAgo(iso) {
  if (!iso) return 'Belum pernah terhubung';
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso)) / 1000));
  if (sec < 60) return 'Baru saja';
  if (sec < 3600) return `${Math.floor(sec / 60)} menit lalu`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} jam lalu`;
  return `${Math.floor(sec / 86400)} hari lalu`;
}
