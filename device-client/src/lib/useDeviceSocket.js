import { useEffect, useRef, useState } from 'react';
import { wsUrl } from './config.js';

const NOT_REGISTERED = 4404;

/**
 * Koneksi WebSocket device dengan reconnect otomatis (exponential backoff, maks. 15 dtk).
 * Status: 'connecting' | 'connected' | 'disconnected' | 'unregistered'.
 * Handler dibaca lewat ref sehingga perubahan handler tidak memutus koneksi.
 */
export function useDeviceSocket(deviceId, { onMessage, onOpen }) {
  const [status, setStatus] = useState('connecting');
  const handlers = useRef({ onMessage, onOpen });
  handlers.current = { onMessage, onOpen };

  useEffect(() => {
    let closed = false;
    let retry = 0;
    let timer;
    let ws;

    const connect = () => {
      setStatus(retry === 0 ? 'connecting' : 'disconnected');
      ws = new WebSocket(wsUrl(deviceId));

      ws.onmessage = ({ data }) => {
        let msg;
        try {
          msg = JSON.parse(data);
        } catch {
          return;
        }
        if (msg.type === 'registered') {
          retry = 0;
          setStatus('connected');
          handlers.current.onOpen?.();
        } else {
          handlers.current.onMessage?.(msg);
        }
      };
      ws.onclose = (event) => {
        if (closed) return;
        if (event.code === NOT_REGISTERED) return setStatus('unregistered');
        setStatus('disconnected');
        timer = setTimeout(connect, Math.min(1000 * 2 ** retry++, 15000));
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [deviceId]);

  return status;
}
