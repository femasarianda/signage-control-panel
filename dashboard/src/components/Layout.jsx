import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Images, LogOut, MonitorSmartphone, Moon, Sun } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useConfirm } from '../lib/confirm.jsx';
import { useTheme } from '../lib/theme.jsx';
import { Button, ICON_STROKE, Logo, Tooltip } from './ui.jsx';

const NAV = [
  { to: '/', label: 'Devices', icon: MonitorSmartphone, end: true },
  { to: '/contents', label: 'Contents', icon: Images },
];

// Lama minimum loader saat pindah halaman: cukup untuk terasa mulus, tidak sampai menghambat.
const TRANSITION_MS = 420;

const navLink = ({ isActive }) =>
  `relative flex h-16 items-center gap-2 px-3 text-sm font-medium transition-colors outline-none
   focus-visible:text-fg after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors ${
     isActive ? 'text-accent-ink after:bg-accent' : 'text-muted hover:text-fg after:bg-transparent hover:after:bg-line-strong'
   }`;

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  const label = dark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap';
  return (
    <Tooltip text={label} side="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className="relative grid size-9 place-items-center overflow-hidden rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Sun
          className={`absolute size-[18px] transition-all duration-300 ${dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`}
          strokeWidth={ICON_STROKE}
          aria-hidden
        />
        <Moon
          className={`absolute size-[18px] transition-all duration-300 ${dark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
          strokeWidth={ICON_STROKE}
          aria-hidden
        />
      </button>
    </Tooltip>
  );
}

/** Layar muat dengan logo di tengah, dipakai saat pertama masuk dan saat pindah menu. */
export function PageLoader({ label = 'Memuat…', className = '' }) {
  return (
    <div className={`anim-fade grid place-items-center bg-bg/85 backdrop-blur-sm ${className}`} role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="relative grid size-20 place-items-center">
          <span className="absolute inset-0 rounded-full border-2 border-accent/15" aria-hidden />
          <span className="anim-spin absolute inset-0 rounded-full border-2 border-transparent border-t-accent" aria-hidden />
          <span className="anim-breathe">
            <Logo size="lg" />
          </span>
        </div>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const { pathname } = useLocation();

  // `settled` tertinggal dari pathname selama transisi, sehingga loader tampil tanpa berkedip.
  const [settled, setSettled] = useState(null);
  const transitioning = settled !== pathname;

  useEffect(() => {
    if (!transitioning) return;
    const timer = setTimeout(() => setSettled(pathname), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [pathname, transitioning]);

  useEffect(() => {
    if (!transitioning) window.scrollTo({ top: 0 });
  }, [transitioning]);

  const askLogout = async () => {
    const ok = await confirm({
      title: 'Keluar dari aplikasi?',
      message: 'Sesi Anda akan diakhiri. Anda perlu masuk kembali untuk mengelola device dan content.',
      confirmLabel: 'Ya, keluar',
      icon: LogOut,
      tone: 'danger',
    });
    if (ok) logout();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-accent">
            <Logo />
            <span className="hidden leading-tight sm:block">
              <span className="block text-[15px] font-semibold text-fg">Signage Control</span>
              <span className="block text-[11px] font-medium text-muted">MJ Solution Indonesia</span>
            </span>
          </NavLink>

          <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />

          <nav className="flex" aria-label="Menu utama">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navLink}>
                <Icon className="size-[18px]" strokeWidth={ICON_STROKE} aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" icon={LogOut} onClick={askLogout} aria-label="Keluar" className="px-2.5 sm:px-3">
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Halaman baru sudah dipasang (dan mulai memuat data) di balik loader, lalu muncul dengan animasi. */}
        <div key={pathname} className={transitioning ? 'invisible' : 'anim-page'}>
          <Outlet />
        </div>
      </main>

      {transitioning && <PageLoader className="fixed inset-x-0 top-16 bottom-0 z-30" />}
    </div>
  );
}
