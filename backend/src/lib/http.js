export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Lempar HttpError jika query Supabase gagal; kembalikan data jika sukses. */
export function unwrap({ data, error }, notFoundMessage) {
  if (error) {
    // PGRST116 = .single() tidak menemukan baris
    if (error.code === 'PGRST116') throw new HttpError(404, notFoundMessage || 'Data tidak ditemukan');
    // 22P02 = format uuid tidak valid
    if (error.code === '22P02') throw new HttpError(400, 'ID tidak valid');
    throw new HttpError(500, error.message);
  }
  return data;
}

export function requireFields(body, fields) {
  const missing = fields.filter((f) => body?.[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length) throw new HttpError(400, `Field wajib diisi: ${missing.join(', ')}`);
}

export function pick(obj, keys) {
  return Object.fromEntries(keys.filter((k) => obj?.[k] !== undefined).map((k) => [k, obj[k]]));
}
