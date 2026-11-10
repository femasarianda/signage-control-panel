import { useState } from 'react';
import { api } from '../lib/api.js';
import { Button, Field, Input, Modal } from './ui.jsx';

export default function DeviceFormModal({ device, onClose, onSaved }) {
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
    <Modal title={device ? 'Edit device' : 'Tambah device'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nama">
          <Input autoFocus value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} required />
        </Field>
        <Field label="Lokasi">
          <Input
            value={form.lokasi}
            placeholder="mis. Lobby lantai 1"
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
          />
        </Field>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose}>Batal</Button>
          <Button variant="primary" type="submit" disabled={busy}>Simpan</Button>
        </div>
      </form>
    </Modal>
  );
}
