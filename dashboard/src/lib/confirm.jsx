import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button, Modal } from '../components/ui.jsx';

const ConfirmContext = createContext(null);

/**
 * Dialog konfirmasi berbasis Promise, pengganti window.confirm().
 *   const ok = await confirm({ title, message, confirmLabel, tone: 'danger', icon });
 * Jika `onConfirm` (async) diberikan, dialog tetap terbuka dengan tombol loading sampai selesai;
 * bila gagal, dialog tetap terbuka supaya pengguna bisa mencoba lagi.
 */
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const resolveRef = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setBusy(false);
        setDialog(options);
      }),
    [],
  );

  const finish = (result) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setDialog(null);
    setBusy(false);
  };

  const accept = async () => {
    if (!dialog.onConfirm) return finish(true);
    setBusy(true);
    try {
      await dialog.onConfirm();
      finish(true);
    } catch {
      setBusy(false);
    }
  };

  const danger = dialog?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <Modal
          size="sm"
          title={dialog.title}
          description={dialog.message}
          icon={dialog.icon ?? TriangleAlert}
          tone={danger ? 'danger' : 'accent'}
          onClose={() => !busy && finish(false)}
          footer={
            <>
              {/* Aksi destruktif: fokus awal di Batal supaya Enter tidak langsung menghapus */}
              <Button onClick={() => finish(false)} disabled={busy} data-autofocus={danger || undefined}>
                {dialog.cancelLabel ?? 'Batal'}
              </Button>
              <Button variant={danger ? 'danger' : 'primary'} onClick={accept} loading={busy} data-autofocus={!danger || undefined}>
                {dialog.confirmLabel ?? 'Lanjutkan'}
              </Button>
            </>
          }
        />
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
