import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVertical, LoaderCircle, MonitorPlay, X } from 'lucide-react';

/** Ketebalan stroke ikon yang seragam di seluruh aplikasi. */
export const ICON_STROKE = 1.75;

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const BUTTON_STYLES = {
  primary: 'bg-accent text-accent-fg font-semibold shadow-sm hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border border-line-strong hover:border-accent hover:text-accent-ink',
  danger: 'bg-danger text-white font-semibold shadow-sm hover:brightness-95',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9.5 px-4 text-sm gap-2',
};

export function Button({ variant = 'secondary', size = 'md', icon: Icon, loading = false, className = '', children, disabled, ...props }) {
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors
        disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${BUTTON_STYLES[variant]} ${BUTTON_SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-4 anim-spin" strokeWidth={2} aria-hidden />
      ) : (
        Icon && <Icon className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
      )}
      {children}
    </button>
  );
}

/** Tombol ikon persegi; `label` wajib untuk aksesibilitas dan dipakai sebagai tooltip. */
export function IconButton({ icon: Icon, label, tone = 'default', className = '', tooltip = true, ...props }) {
  const tones = {
    default: 'text-muted hover:text-fg hover:bg-surface-2',
    danger: 'text-muted hover:text-danger-ink hover:bg-danger-soft',
  };
  const button = (
    <button
      type="button"
      aria-label={label}
      className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-50 ${focusRing} ${tones[tone]} ${className}`}
      {...props}
    >
      <Icon className="size-[18px]" strokeWidth={ICON_STROKE} aria-hidden />
    </button>
  );
  return tooltip ? <Tooltip text={label}>{button}</Tooltip> : button;
}

/** Tooltip ringan (hover/fokus). `show` memaksa tampil, mis. untuk umpan balik "Tersalin!". */
export function Tooltip({ text, show = false, side = 'top', children }) {
  const pos = side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs font-medium text-bg shadow-pop transition-opacity duration-150 ${pos} ${
          show ? 'opacity-100' : 'opacity-0 group-hover/tip:opacity-100 group-has-[:focus-visible]/tip:opacity-100'
        }`}
      >
        {text}
      </span>
    </span>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-fg">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted/80 transition-colors ' +
  'hover:border-muted/60 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/20';

/** Input dengan ikon opsional di kiri. */
export function Input({ icon: Icon, className = '', ...props }) {
  if (!Icon) return <input className={`${inputClass} ${className}`} {...props} />;
  return (
    <span className="relative block">
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" strokeWidth={ICON_STROKE} aria-hidden />
      <input className={`${inputClass} pl-9 ${className}`} {...props} />
    </span>
  );
}

/* ---------- Modal ---------- */

// Tumpukan modal yang terbuka: hanya modal teratas yang merespons Esc, dan scroll body dikunci selama ada modal.
const modalStack = [];
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

export function Modal({ title, description, icon: Icon, tone = 'accent', onClose, children, footer, size = 'md' }) {
  const id = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    modalStack.push(id);
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    // Hormati autoFocus milik isi dialog; selain itu fokus ke elemen pertama di isi/footer, bukan tombol tutup.
    if (!dialog.contains(document.activeElement)) {
      const initial =
        dialog.querySelector('[data-autofocus]') ||
        dialog.querySelector(`[data-modal-body] :is(${FOCUSABLE})`) ||
        dialog.querySelector(`[data-modal-footer] :is(${FOCUSABLE})`) ||
        dialog;
      initial.focus();
    }

    const onKey = (e) => {
      if (modalStack.at(-1) !== id) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        // Jaga fokus tetap di dalam dialog
        const items = [...dialog.querySelectorAll(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0];
        const last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      modalStack.splice(modalStack.indexOf(id), 1);
      if (!modalStack.length) document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [id]);

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-3xl' };

  // Portal ke body: elemen fixed di dalam induk yang beranimasi transform akan ikut terkurung di induk itu.
  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-overlay p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={`anim-pop flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-pop outline-none sm:rounded-2xl ${widths[size]}`}
      >
        <div className="flex items-start gap-3 px-5 pt-5 pb-4">
          {Icon && (
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                tone === 'danger' ? 'bg-danger-soft text-danger-ink' : 'bg-accent-soft text-accent-ink'
              }`}
            >
              <Icon className="size-5" strokeWidth={ICON_STROKE} aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 id={`${id}-title`} className="text-base font-semibold text-fg">{title}</h2>
            {description && <p id={`${id}-desc`} className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <IconButton icon={X} label="Tutup" onClick={onClose} tooltip={false} className="-mt-1 -mr-2" />
        </div>
        {children && <div data-modal-body className="overflow-y-auto px-5 pb-5">{children}</div>}
        {footer && <div data-modal-footer className="flex justify-end gap-2 border-t border-line bg-surface-2/60 px-5 py-3.5 sm:rounded-b-2xl">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Menu titik tiga ---------- */

/** items: [{ label, icon, onSelect, tone?: 'danger' } | 'divider'] */
export function Menu({ label = 'Aksi lainnya', items }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const menuItems = () => [...rootRef.current.querySelectorAll('[role="menuitem"]')];
    menuItems()[0]?.focus();

    const onDown = (e) => !rootRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      const list = menuItems();
      const idx = list.indexOf(document.activeElement);
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        list[(idx + 1) % list.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        list[(idx - 1 + list.length) % list.length].focus();
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        ref={buttonRef}
        icon={EllipsisVertical}
        label={label}
        tooltip={false}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={open ? 'bg-surface-2 text-fg' : ''}
      />
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="anim-menu absolute right-0 bottom-full z-30 mb-1.5 min-w-44 rounded-xl border border-line bg-surface p-1.5 shadow-pop"
        >
          {items.map((item, i) =>
            item === 'divider' ? (
              <div key={i} role="separator" className="my-1 h-px bg-line" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors ${
                  item.tone === 'danger'
                    ? 'text-danger-ink hover:bg-danger-soft focus-visible:bg-danger-soft'
                    : 'text-fg hover:bg-surface-2 focus-visible:bg-surface-2'
                }`}
              >
                <item.icon className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Status & feedback ---------- */

export function StatusBadge({ status, className = '' }) {
  const online = status === 'online';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        online ? 'bg-online-soft text-online-ink' : 'bg-offline-soft text-offline-ink'
      } ${className}`}
    >
      <span className={`size-1.5 rounded-full ${online ? 'pulse-online bg-online' : 'bg-offline'}`} aria-hidden />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
      {Icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
          <Icon className="size-6" strokeWidth={ICON_STROKE} aria-hidden />
        </span>
      )}
      {title && <p className="font-semibold text-fg">{title}</p>}
      <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden />;
}

export function Spinner({ className = 'size-5' }) {
  return <LoaderCircle className={`anim-spin text-accent-ink ${className}`} strokeWidth={2} aria-hidden />;
}

/** Logo aplikasi: monitor + tombol play di kotak teal brand. */
export function Logo({ size = 'md' }) {
  const sizes = { sm: 'size-8 rounded-lg', md: 'size-9 rounded-xl', lg: 'size-14 rounded-2xl' };
  const icons = { sm: 'size-[18px]', md: 'size-5', lg: 'size-7' };
  return (
    <span className={`grid shrink-0 place-items-center bg-accent text-accent-fg shadow-sm ${sizes[size]}`}>
      <MonitorPlay className={icons[size]} strokeWidth={ICON_STROKE} aria-hidden />
    </span>
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
