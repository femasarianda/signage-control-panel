import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_URL = 'http://localhost:5174';
const isDev = process.argv.includes('--dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    title: 'Signage Player',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Video/audio boleh autoplay tanpa interaksi pengguna (layar signage tidak disentuh)
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  // F11: layar penuh on/off. Esc: keluar dari layar penuh.
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    } else if (input.key === 'Escape' && win.isFullScreen()) {
      win.setFullScreen(false);
      event.preventDefault();
    }
  });

  // Opsional: `Signage Player.exe --device=<id>` langsung menghubungkan ke device itu (mode kiosk)
  const deviceArg = process.argv.find((a) => a.startsWith('--device='));
  const query = deviceArg ? { device: deviceArg.slice('--device='.length) } : undefined;

  if (isDev) win.loadURL(query ? `${DEV_URL}/?device=${query.device}` : DEV_URL);
  else win.loadFile(path.join(__dirname, '../dist/index.html'), { query });
}

// Hanya satu instance player per komputer
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
    app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
  });

  app.on('window-all-closed', () => app.quit());
}
