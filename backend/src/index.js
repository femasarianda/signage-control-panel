import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import contentRoutes from './routes/contents.js';
import publicRoutes from './routes/public.js';
import { resetStatuses, setupWebSocket } from './ws/hub.js';

const app = express();
app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : true }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/devices', requireAuth, deviceRoutes);
app.use('/api/contents', requireAuth, contentRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const server = http.createServer(app);
setupWebSocket(server);

server.listen(config.port, async () => {
  await resetStatuses(); // sisa status 'online' dari proses sebelumnya sudah tidak valid
  console.log(`Backend berjalan di http://localhost:${config.port} (WebSocket: /ws)`);
});
