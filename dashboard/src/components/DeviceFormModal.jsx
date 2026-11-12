import { useId, useState } from 'react';
import { MapPin, Monitor, MonitorSmartphone, Pencil } from 'lucide-react';
import { api } from '../lib/api.js';
import { Button, Field, Input, Modal } from './ui.jsx';

export default function DeviceFormModal({ device, onClose, onSaved }) {
  const formId = useId();
  const [form, setForm] = useState({ nama: device?.nama ?? '', lokasi: device?.lokasi ?? '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (device) await api.devices.update(device.id, form);
      else await api.devices.create(form);
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={device ? 'Edit device' : 'Tambah device'}
      description={device ? 'Perbarui nama atau lokasi layar ini.' : 'Daftarkan layar signage baru.'}
      icon={device ? Pencil : MonitorSmartphone}
      onClose={onClose}
      footer={
        <>
          <Button type="button" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" form={formId} loading={busy}>
            {device ? 'Simpan perubahan' : 'Tambah device'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <Field label="Nama device">
          <Input
            icon={Monitor}
            autoFocus
            value={form.nama}
            placeholder="mis. Layar Lobby 1"
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
        </Field>
        <Field label="Lokasi" hint="Opsional. Membantu mencari device di daftar.">
          <Input
            icon={MapPin}
            value={form.lokasi}
            placeholder="mis. Lobby lantai 1"
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
          />
        </Field>
        {error && <p className="text-sm text-danger-ink" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}
