import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from './config.js';

const cacheKey = (id) => `playlist:${id}`;

const readCache = (id) => {
  try {
    return JSON.parse(localStorage.getItem(cacheKey(id)));
  } catch {
    return null;
  }
};

/**
 * Memuat info device + playlist. Hasil terakhir disimpan di localStorage,
 * sehingga player tetap bisa menayangkan konten saat backend/jaringan sedang mati.
 */
export function usePlaylist(deviceId) {
  const [data, setData] = useState(() => readCache(deviceId)); // { device, playlist }
  const [notFound, setNotFound] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/public/devices/${deviceId}`));
      if (res.status === 404 || res.status === 400) return setNotFound(true);
      if (!res.ok) return;
      const fresh = await res.json();
      setNotFound(false);
      setData(fresh);
      try {
        localStorage.setItem(cacheKey(deviceId), JSON.stringify(fresh));
      } catch {
        /* abaikan */
      }
    } catch {
      /* offline: tetap pakai data yang ada */
    }
  }, [deviceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { device: data?.device ?? null, playlist: data?.playlist ?? [], notFound, refresh };
}
