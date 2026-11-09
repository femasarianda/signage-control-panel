import { WebSocketServer } from 'ws';
import { config } from '../config.js';
import { supabase } from '../lib/supabase.js';
import { verifyToken } from '../middleware/auth.js';

/**
 * WebSocket hub.
 *
 * Koneksi:
 *   ws://host/ws?role=dashboard&token=<JWT>   -> menerima event status device
 *   ws://host/ws?role=device&deviceId=<uuid>  -> device client; online selama socket hidup
 *
 * Pesan server -> dashboard:
 *   { type: 'snapshot', online: [deviceId...] }
 *   { type: 'device_status', id, status, last_seen }
 *   { type: 'devices_changed' }
 * Pesan server -> device:
 *   { type: 'push_content', content }
 *   { type: 'playlist_updated' }
 */

const devices = new Map(); // deviceId -> Set<WebSocket>
const dashboards = new Set();
let wss;

const send = (ws, msg) => {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
};

export function broadcastToDashboards(msg) {
  for (const ws of dashboards) send(ws, msg);
}

export function isDeviceOnline(deviceId) {
  return devices.has(deviceId);
}

export function sendToDevice(deviceId, msg) {
  const sockets = devices.get(deviceId);
  if (!sockets) return false;
  for (const ws of sockets) send(ws, msg);
  return true;
}

async function setStatus(id, status) {
  const last_seen = new Date().toISOString();
  const { error } = await supabase.from('devices').update({ status, last_seen }).eq('id', id);
  if (error) console.error(`[ws] gagal update status ${id}:`, error.message);
  broadcastToDashboards({ type: 'device_status', id, status, last_seen });
}

async function registerDevice(ws, deviceId) {
  const { data } = await supabase.from('devices').select('id').eq('id', deviceId).maybeSingle();
  if (!data) return ws.close(4404, 'Device tidak terdaftar');

  let sockets = devices.get(deviceId);
  const wasOffline = !sockets;
  if (!sockets) devices.set(deviceId, (sockets = new Set()));
  sockets.add(ws);
  ws.deviceId = deviceId;
  send(ws, { type: 'registered', deviceId });
  if (wasOffline) await setStatus(deviceId, 'online');
}

async function unregister(ws) {
  if (ws.role === 'dashboard') return void dashboards.delete(ws);
  const sockets = devices.get(ws.deviceId);
  if (!sockets) return;
  sockets.delete(ws);
  if (sockets.size === 0) {
    devices.delete(ws.deviceId);
    await setStatus(ws.deviceId, 'offline');
  }
}

/** Ping berkala: socket yang tidak membalas pong dianggap mati (mis. kabel dicabut). */
function startHeartbeat() {
  return setInterval(async () => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
    const ids = [...devices.keys()];
    if (ids.length) {
      await supabase.from('devices').update({ last_seen: new Date().toISOString() }).in('id', ids);
    }
  }, config.heartbeatMs);
}

export async function resetStatuses() {
  await supabase.from('devices').update({ status: 'offline' }).eq('status', 'online');
}

export function setupWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const params = new URL(req.url, 'http://localhost').searchParams;
    const role = params.get('role');
    ws.isAlive = true;
    ws.role = role;
    ws.on('pong', () => (ws.isAlive = true));
    ws.on('error', (err) => console.error('[ws] error:', err.message));
    ws.on('close', () => unregister(ws));

    if (role === 'dashboard') {
      if (!verifyToken(params.get('token'))) return ws.close(4401, 'Unauthorized');
      dashboards.add(ws);
      return send(ws, { type: 'snapshot', online: [...devices.keys()] });
    }
    if (role === 'device') {
      const deviceId = params.get('deviceId');
      if (!deviceId) return ws.close(4400, 'deviceId wajib');
      return void registerDevice(ws, deviceId).catch(() => ws.close(1011, 'Server error'));
    }
    ws.close(4400, 'role tidak valid');
  });

  const timer = startHeartbeat();
  wss.on('close', () => clearInterval(timer));
  return wss;
}
