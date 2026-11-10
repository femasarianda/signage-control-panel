import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getToken } from './api.js';

/**
 * Daftar device + status real-time lewat WebSocket.
 * - 'device_status' memperbarui satu device di tempat (tanpa refetch).
 * - 'devices_changed' (CRUD dari admin lain) memicu refetch.
 * - Reconnect otomatis dengan exponential backoff; setelah tersambung ulang, data disinkronkan lagi.
 */
export function useDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const socketRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      setDevices(await api.devices.list());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let closed = false;
    let retry = 0;
    let timer;

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${proto}://${location.host}/ws?role=dashboard&token=${getToken()}`);
      socketRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        setLive(true);
        refresh(); // sinkronkan perubahan yang terlewat selama terputus
      };
      ws.onmessage = ({ data }) => {
        const msg = JSON.parse(data);
        if (msg.type === 'device_status') {
          setDevices((prev) =>
            prev.map((d) => (d.id === msg.id ? { ...d, status: msg.status, last_seen: msg.last_seen } : d)),
          );
        } else if (msg.type === 'devices_changed') {
          refresh();
        }
      };
      ws.onclose = () => {
        setLive(false);
        if (closed) return;
        timer = setTimeout(connect, Math.min(1000 * 2 ** retry++, 15000));
      };
    };

    refresh();
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      socketRef.current?.close();
    };
  }, [refresh]);

  return { devices, loading, error, live, refresh };
}
