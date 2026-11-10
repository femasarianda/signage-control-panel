import 'dotenv/config';

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} wajib diisi (lihat .env.example)`);
  return value;
};

export const config = {
  port: Number(process.env.PORT) || 3000,
  supabaseUrl: required('SUPABASE_URL'),
  supabaseKey: required('SUPABASE_SECRET_KEY'),
  bucket: process.env.SUPABASE_BUCKET || 'contents',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // Kosong = izinkan semua origin. Jika diisi, origin 'null' (halaman file:// milik app Electron)
  // selalu ikut diizinkan. Aman karena autentikasi memakai header Bearer, bukan cookie.
  corsOrigins: (() => {
    const list = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
    return list.length ? [...list, 'null'] : [];
  })(),
  heartbeatMs: 15000,
};
