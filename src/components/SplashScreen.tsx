import { useState, type FormEvent } from 'react';
import { Mail, Lock, Loader2, Chrome, Eye, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function SplashScreen({ onBrowse }: { onBrowse: () => void }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInDemo } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setBusy(true);
    const { error: err } =
      mode === 'login'
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password);
    setBusy(false);
    if (err) setError(err);
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    setGoogleLoading(true);
    const { error: err } = await signInWithGoogle();
    setBusy(false);
    setGoogleLoading(false);
    if (err) setError(err);
  };

  const handleDemo = async () => {
    setError(null);
    setBusy(true);
    const { error: err } = await signInDemo();
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="relative mb-8 animate-scale-in">
          <img src="/logo.svg" alt="Purani Book" className="h-24 w-24 rounded-3xl object-cover shadow-2xl shadow-brand/20" />
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-ink-800 ring-2 ring-ink-950" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Purani <span className="text-brand">Book</span>
        </h1>
        <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-ink-400">
          Books find a new life here. Where stories find a new home. Sign in to start trading books nearby.
        </p>
      </div>

      {/* Auth */}
      <div className="flex flex-col gap-3 px-6 pb-10">
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink-700 bg-ink-800 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-ink-700 active:scale-95 disabled:opacity-50"
        >
          {googleLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Connecting to Google...
            </>
          ) : (
            <>
              <Chrome className="h-5 w-5" />
              Continue with Google
            </>
          )}
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-ink-800" />
          <span className="text-xs font-medium text-ink-500">or</span>
          <div className="h-px flex-1 bg-ink-800" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="input-dark pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="input-dark pl-10"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
          }}
          className="text-center text-xs font-medium text-ink-400 transition-colors hover:text-brand"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>

        {/* Quick demo login */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-ink-800" />
          <span className="text-xs font-medium text-ink-500">or</span>
          <div className="h-px flex-1 bg-ink-800" />
        </div>

        <button
          onClick={handleDemo}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-semibold text-brand transition-all hover:bg-brand/20 active:scale-95 disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          Quick Demo Login
        </button>
        <p className="text-center text-[11px] text-ink-600">
          Skip sign-in and explore the app instantly
        </p>
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={onBrowse}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-ink-400 transition-all hover:text-brand"
        >
          <Eye className="h-4 w-4" />
          Browse as Guest
        </button>
      </div>
    </div>
  );
}
