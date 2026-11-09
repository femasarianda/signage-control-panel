import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { unwrap } from '../lib/http.js';
import { getPlaylist } from './devices.js';

// Endpoint tanpa login untuk device client (hanya baca)
const router = Router();

router.get('/devices/:id', async (req, res) => {
  const device = unwrap(
    await supabase.from('devices').select('id, nama, lokasi').eq('id', req.params.id).single(),
    'Device tidak ditemukan',
  );
  res.json({ device, playlist: await getPlaylist(device.id) });
});

export default router;
