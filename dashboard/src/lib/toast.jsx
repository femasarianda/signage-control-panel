import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { ICON_STROKE } from '../components/ui.jsx';

const ToastContext = createContext(null);

const KINDS = {
  success: { icon: CircleCheck, className: 'text-online-ink' },
  error: { icon: CircleAlert, className: 'text-danger-ink' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (message, kind) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, kind }]);
      setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const { icon: Icon, className } = KINDS[t.kind];
          return (
            <div
              key={t.id}
              className="anim-toast pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-line bg-surface py-3 pr-2 pl-3.5 text-sm text-fg shadow-pop"
            >
              <Icon className={`mt-0.5 size-[18px] shrink-0 ${className}`} strokeWidth={ICON_STROKE} aria-hidden />
              <p className="min-w-0 flex-1 pt-px">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="grid size-6 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <X className="size-3.5" strokeWidth={2} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
