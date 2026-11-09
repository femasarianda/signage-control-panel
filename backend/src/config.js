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
  corsOrigins: (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
  heartbeatMs: 15000,
};
