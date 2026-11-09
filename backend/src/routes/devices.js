import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError, pick, requireFields, unwrap } from '../lib/http.js';
import { broadcastToDashboards, sendToDevice } from '../ws/hub.js';

const router = Router();
const FIELDS = ['nama', 'lokasi'];

router.get('/', async (_req, res) => {
  res.json(unwrap(await supabase.from('devices').select('*').order('nama')));
});

router.get('/:id', async (req, res) => {
  res.json(unwrap(await supabase.from('devices').select('*').eq('id', req.params.id).single(), 'Device tidak ditemukan'));
});

router.post('/', async (req, res) => {
  requireFields(req.body, ['nama']);
  const device = unwrap(await supabase.from('devices').insert(pick(req.body, FIELDS)).select().single());
  broadcastToDashboards({ type: 'devices_changed' });
  res.status(201).json(device);
});

router.put('/:id', async (req, res) => {
  const device = unwrap(
    await supabase.from('devices').update(pick(req.body, FIELDS)).eq('id', req.params.id).select().single(),
    'Device tidak ditemukan',
  );
  broadcastToDashboards({ type: 'devices_changed' });
  res.json(device);
});

router.delete('/:id', async (req, res) => {
  unwrap(await supabase.from('devices').delete().eq('id', req.params.id).select().single(), 'Device tidak ditemukan');
  broadcastToDashboards({ type: 'devices_changed' });
  res.status(204).end();
});

/* ---------- Playlist (bonus) ---------- */

export async function getPlaylist(deviceId) {
  const rows = unwrap(
    await supabase
      .from('device_contents')
      .select('position, duration_sec, content:contents(*)')
      .eq('device_id', deviceId)
      .order('position'),
  );
  return rows.map(({ content, position, duration_sec }) => ({ ...content, position, duration_sec }));
}

router.get('/:id/playlist', async (req, res) => {
  res.json(await getPlaylist(req.params.id));
});

// Ganti seluruh playlist: body { items: [{ content_id, duration_sec? }] } (urutan array = urutan tayang)
router.put('/:id/playlist', async (req, res) => {
  const { items } = req.body ?? {};
  if (!Array.isArray(items)) throw new HttpError(400, 'items harus berupa array');
  const deviceId = req.params.id;

  unwrap(await supabase.from('devices').select('id').eq('id', deviceId).single(), 'Device tidak ditemukan');
  unwrap(await supabase.from('device_contents').delete().eq('device_id', deviceId));
  if (items.length) {
    const rows = items.map((item, position) => ({
      device_id: deviceId,
      content_id: item.content_id,
      position,
      duration_sec: Number(item.duration_sec) > 0 ? Number(item.duration_sec) : 10,
    }));
    unwrap(await supabase.from('device_contents').insert(rows));
  }
  sendToDevice(deviceId, { type: 'playlist_updated' });
  res.json(await getPlaylist(deviceId));
});

/* ---------- Command push (bonus) ---------- */

// Kirim konten langsung ke device tertentu: body { content_id }
router.post('/:id/push', async (req, res) => {
  requireFields(req.body, ['content_id']);
  const content = unwrap(
    await supabase.from('contents').select('*').eq('id', req.body.content_id).single(),
    'Content tidak ditemukan',
  );
  const delivered = sendToDevice(req.params.id, { type: 'push_content', content });
  if (!delivered) throw new HttpError(409, 'Device sedang offline');
  res.json({ delivered: true });
});

export default router;
