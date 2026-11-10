import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useTheme } from '../lib/theme.jsx';
import { Button } from './ui.jsx';

const link = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg'
  }`;

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <Button variant="ghost" onClick={toggle} aria-label={dark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}>
      {dark ? '☀️ Terang' : '🌙 Gelap'}
    </Button>
  );
}

export default function Layout() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-sm text-accent-fg">▶</span>
            <span className="hidden sm:inline">Signage Control</span>
          </div>
          <nav className="flex gap-1">
            <NavLink to="/" end className={link}>Devices</NavLink>
            <NavLink to="/contents" className={link}>Contents</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" onClick={logout}>Keluar</Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
