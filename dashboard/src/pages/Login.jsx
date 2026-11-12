import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CircleAlert, Eye, EyeOff, Lock, LogIn, User } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, ICON_STROKE, Input, Logo } from '../components/ui.jsx';
import { ThemeToggle } from '../components/Layout.jsx';

export default function Login() {
  const { token, login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      {/* Latar lembut bernuansa brand */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)' }}
        aria-hidden
      />
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="anim-page relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-fg">Signage Control Panel</h1>
          <p className="mt-1 text-sm text-muted">Masuk untuk mengelola device dan content</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-pop">
          <Field label="Username">
            <Input
              icon={User}
              autoFocus
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </Field>
          <Field label="Password">
            <span className="relative block">
              <Input
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
              >
                {showPassword ? (
                  <EyeOff className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
                ) : (
                  <Eye className="size-4" strokeWidth={ICON_STROKE} aria-hidden />
                )}
              </button>
            </span>
          </Field>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-ink" role="alert">
              <CircleAlert className="size-4 shrink-0" strokeWidth={ICON_STROKE} aria-hidden />
              {error}
            </p>
          )}

          <Button variant="primary" type="submit" icon={LogIn} loading={busy} className="w-full">
            {busy ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">© {new Date().getFullYear()} MJ Solution Indonesia</p>
      </div>
    </div>
  );
}
