import { useState } from 'react';
import { Inbox, Send } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Button, EmptyState, Modal } from './ui.jsx';
import ContentPreview, { TypeTag } from './ContentPreview.jsx';

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
    <Modal
      title={`Push ke ${device.nama}`}
      description="Content langsung tampil di device, menggantikan tayangan sementara (30 detik, video sampai selesai)."
      icon={Send}
      onClose={onClose}
    >
      {contents.length === 0 ? (
        <EmptyState icon={Inbox} title="Belum ada content">Tambahkan content di menu Contents terlebih dahulu.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {contents.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border border-line p-2 pr-2.5 transition-colors hover:border-line-strong">
              <ContentPreview content={c} className="size-12 shrink-0 rounded-lg" compact />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{c.judul}</p>
                <TypeTag tipe={c.tipe} className="mt-1" />
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Send}
                loading={sendingId === c.id}
                disabled={sendingId !== null}
                onClick={() => push(c)}
              >
                {sendingId === c.id ? 'Mengirim…' : 'Kirim'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
