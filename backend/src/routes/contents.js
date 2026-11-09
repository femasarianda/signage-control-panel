import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { supabase } from '../lib/supabase.js';
import { HttpError, pick, requireFields, unwrap } from '../lib/http.js';

const router = Router();
const TYPES = ['image', 'video', 'text', 'url'];
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const validateType = (tipe) => {
  if (!TYPES.includes(tipe)) throw new HttpError(400, `tipe harus salah satu dari: ${TYPES.join(', ')}`);
};

router.get('/', async (_req, res) => {
  res.json(unwrap(await supabase.from('contents').select('*').order('created_at', { ascending: false })));
});

router.get('/:id', async (req, res) => {
  res.json(unwrap(await supabase.from('contents').select('*').eq('id', req.params.id).single(), 'Content tidak ditemukan'));
});

// Attach content tanpa file: teks atau URL eksternal
router.post('/', async (req, res) => {
  requireFields(req.body, ['judul', 'tipe', 'payload']);
  validateType(req.body.tipe);
  const content = unwrap(
    await supabase.from('contents').insert(pick(req.body, ['judul', 'tipe', 'payload'])).select().single(),
  );
  res.status(201).json(content);
});

// Upload file gambar/video ke Supabase Storage, lalu simpan URL publiknya sebagai payload
router.post('/upload', upload.single('file'), async (req, res) => {
  const { file } = req;
  if (!file) throw new HttpError(400, 'File wajib diunggah (field: file)');
  const tipe = file.mimetype.startsWith('image/') ? 'image' : file.mimetype.startsWith('video/') ? 'video' : null;
  if (!tipe) throw new HttpError(400, 'Hanya file gambar atau video yang didukung');

  const objectPath = `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`;
  const { error } = await supabase.storage
    .from(config.bucket)
    .upload(objectPath, file.buffer, { contentType: file.mimetype });
  if (error) throw new HttpError(500, `Upload gagal: ${error.message}`);

  const { data } = supabase.storage.from(config.bucket).getPublicUrl(objectPath);
  const judul = req.body.judul || path.parse(file.originalname).name;
  const content = unwrap(
    await supabase.from('contents').insert({ judul, tipe, payload: data.publicUrl }).select().single(),
  );
  res.status(201).json(content);
});

router.put('/:id', async (req, res) => {
  if (req.body.tipe !== undefined) validateType(req.body.tipe);
  const content = unwrap(
    await supabase
      .from('contents')
      .update(pick(req.body, ['judul', 'tipe', 'payload']))
      .eq('id', req.params.id)
      .select()
      .single(),
    'Content tidak ditemukan',
  );
  res.json(content);
});

router.delete('/:id', async (req, res) => {
  const content = unwrap(
    await supabase.from('contents').delete().eq('id', req.params.id).select().single(),
    'Content tidak ditemukan',
  );
  // Hapus file di Storage jika content berasal dari bucket kita (best effort)
  const marker = `/object/public/${config.bucket}/`;
  const idx = content.payload.indexOf(marker);
  if (idx !== -1) {
    await supabase.storage.from(config.bucket).remove([content.payload.slice(idx + marker.length)]);
  }
  res.status(204).end();
});

export default router;
