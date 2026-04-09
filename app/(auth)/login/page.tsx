'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { LayoutDashboard } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      setError('Supabase not configured: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Force a full page reload to ensure middleware picks up the new cookies
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error during login');
      setLoading(false);
    }
  }

  const inputClass =
    'block w-full rounded-lg border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted transition-all duration-200';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface overflow-hidden">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/[0.04] blur-[120px]" />

      <div className="relative w-full max-w-[400px] px-4 animate-fade-in">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent glow-orange">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Welcome back</h1>
          <p className="mt-1.5 text-sm text-text-muted">Sign in to your agency dashboard</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl shadow-black/40">
          <div className="h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-text-secondary">
                  Email
                </label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@company.com" required />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-text-secondary">
                  Password
                </label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Enter your password" required />
              </div>
              <Button type="submit" className="w-full glow-orange-sm hover:glow-orange transition-shadow duration-300" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-surface-border" />
              <span className="text-xs text-text-muted">or</span>
              <div className="h-px flex-1 bg-surface-border" />
            </div>

            <p className="text-center text-sm text-text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-accent hover:text-accent-hover transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted/50">
          Wellness BI &middot; Agency Dashboard
        </p>
      </div>
    </div>
  );
}
