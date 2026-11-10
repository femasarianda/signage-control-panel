import { useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Button, EmptyState, Modal } from './ui.jsx';
import ContentPreview, { typeLabel } from './ContentPreview.jsx';

export default function PushModal({ device, contents, onClose }) {
  const toast = useToast();
  const [sendingId, setSendingId] = useState(null);

  const push = async (content) => {
    setSendingId(content.id);
    try {
      await api.devices.push(device.id, content.id);
      toast.success(`"${content.judul}" dikirim ke ${device.nama}`);
      onClose();
    } catch (err) {
      toast.error(err.message);
      setSendingId(null);
    }
  };

  return (
    <Modal title={`Push ke ${device.nama}`} onClose={onClose}>
      <p className="mb-3 text-sm text-muted">Content langsung tampil di device, mengganti yang sedang tayang.</p>
      {contents.length === 0 ? (
        <EmptyState>Belum ada content.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {contents.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-lg border border-line p-2">
              <ContentPreview content={c} className="size-12 shrink-0 rounded" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.judul}</p>
                <p className="text-xs text-muted">{typeLabel(c.tipe)}</p>
              </div>
              <Button variant="primary" className="px-3 py-1.5" disabled={sendingId !== null} onClick={() => push(c)}>
                {sendingId === c.id ? 'Mengirim…' : 'Kirim'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
