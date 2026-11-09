import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase.js';
import { HttpError, requireFields, unwrap } from '../lib/http.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const { username, password } = req.body;
  const admin = unwrap(await supabase.from('admins').select('*').eq('username', username).maybeSingle());
  const valid = admin && (await bcrypt.compare(password, admin.password_hash));
  if (!valid) throw new HttpError(401, 'Username atau password salah');
  res.json({ token: signToken(admin), username: admin.username });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.admin.username });
});

export default router;
