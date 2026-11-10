import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  // base relatif supaya hasil build bisa dibuka dari file:// (dibutuhkan saat dibungkus Electron)
  base: './',
  server: {
    port: 5174,
    proxy: {
      '/api': BACKEND,
      '/ws': { target: BACKEND, ws: true },
    },
  },
});
