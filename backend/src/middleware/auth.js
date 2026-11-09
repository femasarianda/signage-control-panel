import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';

export function signToken(admin) {
  return jwt.sign({ sub: admin.id, username: admin.username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return next(new HttpError(401, 'Unauthorized'));
  req.admin = payload;
  next();
}
