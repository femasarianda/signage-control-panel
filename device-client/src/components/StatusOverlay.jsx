import { useEffect, useState } from 'react';

const LABELS = {
  connecting: 'Menyambung…',
  connected: 'Terhubung',
  disconnected: 'Terputus, mencoba menyambung ulang…',
};

/** Pil status koneksi + tombol layar penuh/ganti device. Tampil saat mouse bergerak atau koneksi bermasalah. */
export default function StatusOverlay({ status, deviceName, onReset }) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    let timer;
    const wake = () => {
      setActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setActive(false), 3000);
    };
    wake();
    window.addEventListener('mousemove', wake);
    window.addEventListener('keydown', wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  const toggleFullscreen = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();

  const visible = active || status !== 'connected';
  return (
    <div className={`overlay ${visible ? 'visible' : ''}`}>
      <span className={`pill pill-${status}`}>
        <span className="dot" />
        {deviceName ? `${deviceName} · ` : ''}
        {LABELS[status] ?? status}
      </span>
      <span className="actions">
        <button onClick={toggleFullscreen}>Layar penuh</button>
        <button onClick={onReset}>Ganti device</button>
      </span>
    </div>
  );
}
