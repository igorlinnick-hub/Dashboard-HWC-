'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase returns the recovery token in the URL hash. The SDK picks it up
  // automatically and fires PASSWORD_RECOVERY — we just wait for a session.
  useEffect(() => {
    const supabase = createBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.updateUser({ password });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      setDone(true);
      setLoading(false);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      setLoading(false);
    }
  }

  const inputClass =
    'block w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/[0.04] blur-[120px]" />

      <div className="relative w-full max-w-[400px] px-4 animate-fade-in">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent glow-orange">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {done ? 'Password updated' : 'Set a new password'}
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {done
              ? 'Redirecting you to the dashboard...'
              : 'Choose a strong password you will remember'}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl shadow-black/40">
          <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            {done ? (
              <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 animate-fade-in">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-400" />
                <div className="text-sm text-green-100/90 leading-snug">
                  Your password has been updated. Taking you to your dashboard...
                </div>
              </div>
            ) : !ready ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                <p className="text-sm text-text-muted">Verifying reset link...</p>
                <p className="text-xs text-text-muted/70 text-center leading-snug max-w-[280px]">
                  If nothing happens within a few seconds, your link may have expired.{' '}
                  <Link href="/forgot-password" className="text-accent hover:underline">
                    Request a new one
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-[13px] font-medium text-text-secondary"
                  >
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="At least 8 characters"
                    required
                    autoFocus
                    minLength={8}
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm"
                    className="mb-1.5 block text-[13px] font-medium text-text-secondary"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputClass}
                    placeholder="Repeat the same password"
                    required
                    minLength={8}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full glow-orange-sm hover:glow-orange transition-shadow duration-300"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Updating...
                    </span>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted/50">
          Wellness BI &middot; Agency Dashboard
        </p>
      </div>
    </div>
  );
}
