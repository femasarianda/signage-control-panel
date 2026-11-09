// Pemakaian: npm run create-admin -- <username> <password>
import bcrypt from 'bcryptjs';
import { supabase } from '../src/lib/supabase.js';

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error('Pemakaian: npm run create-admin -- <username> <password>');
  process.exit(1);
}

const password_hash = await bcrypt.hash(password, 10);
const { error } = await supabase.from('admins').upsert({ username, password_hash }, { onConflict: 'username' });
if (error) {
  console.error('Gagal:', error.message);
  process.exit(1);
}
console.log(`Admin "${username}" siap dipakai.`);
