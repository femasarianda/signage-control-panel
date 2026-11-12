import { createLogger, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const BACKEND = 'http://localhost:3000';

// StrictMode di dev memasang effect dua kali, sehingga socket pertama ditutup sebelum handshake selesai.
// Proxy lalu gagal menulis ke socket itu (ECONNABORTED/ECONNRESET). Tidak berbahaya, jadi tidak perlu dicetak.
const IGNORED_WS_ERRORS = new Set(['ECONNABORTED', 'ECONNRESET']);
const logger = createLogger();
const logError = logger.error;
logger.error = (msg, options) => {
  if (msg.includes('ws proxy') && IGNORED_WS_ERRORS.has(options?.error?.code)) return;
  logError(msg, options);
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  customLogger: logger,
  server: {
    port: 5173,
    // Proxy ke backend supaya tidak perlu urus CORS / URL saat development
    proxy: {
      '/api': BACKEND,
      '/ws': { target: BACKEND, ws: true },
    },
  },
});
