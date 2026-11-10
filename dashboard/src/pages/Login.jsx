import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Button, Field, Input } from '../components/ui.jsx';
import { ThemeToggle } from '../components/Layout.jsx';

export default function Login() {
  const { token, login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
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
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-line bg-surface p-6 shadow-lg">
        <div className="text-center">
          <span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-accent text-lg text-accent-fg">▶</span>
          <h1 className="text-lg font-semibold">Signage Control Panel</h1>
          <p className="mt-1 text-sm text-muted">Masuk untuk mengelola device dan content</p>
        </div>
        <Field label="Username">
          <Input
            autoFocus
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </Field>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <Button variant="primary" type="submit" disabled={busy} className="w-full">
          {busy ? 'Memproses…' : 'Masuk'}
        </Button>
      </form>
    </div>
  );
}
