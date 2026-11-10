import { useState } from 'react';

/** Layar awal: tampil jika belum ada ID device, atau ID tidak dikenali backend. */
export default function Setup({ initialError, onSubmit }) {
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  };

  return (
    <div className="center-screen">
      <form className="card" onSubmit={submit}>
        <h1>Signage Player</h1>
        <p className="muted">
          Masukkan ID device yang terdaftar di dashboard, atau buka link player yang disalin dari dashboard.
        </p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ID device"
          aria-label="ID device"
        />
        {initialError && <p className="error" role="alert">{initialError}</p>}
        <button type="submit">Hubungkan</button>
      </form>
    </div>
  );
}
