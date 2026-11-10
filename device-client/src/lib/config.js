// Alamat backend. Kosong = origin yang sama (dev: lewat proxy Vite).
// Untuk build Electron / hosting terpisah, isi lewat VITE_BACKEND_URL, mis. http://localhost:3000
const BACKEND = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export const apiUrl = (path) => `${BACKEND}${path}`;

export const wsUrl = (deviceId) => {
  const base = BACKEND || location.origin;
  return `${base.replace(/^http/, 'ws')}/ws?role=device&deviceId=${encodeURIComponent(deviceId)}`;
};

// Berapa lama konten hasil "push" ditampilkan sebelum kembali ke playlist (detik)
export const PUSH_DURATION_SEC = 30;
