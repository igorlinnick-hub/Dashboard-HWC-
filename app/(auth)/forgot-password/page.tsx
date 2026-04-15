'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
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
            <KeyRound className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {sent ? 'Check your email' : 'Forgot your password?'}
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            {sent
              ? 'We sent you a secure link to reset your password'
              : 'Enter your email and we will send you a reset link'}
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

            {sent ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-400" />
                  <div className="text-sm text-green-100/90 leading-snug">
                    If an account exists for <span className="font-medium">{email}</span>, a reset
                    link will arrive shortly. The link is valid for 1 hour.
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Not seeing it? Check your spam folder. Still nothing? Try again in a few
                  minutes — the email provider may be rate-limited.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[13px] font-medium text-text-secondary"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@company.com"
                    required
                    autoFocus
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
                      Sending link...
                    </span>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            )}

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-surface-border" />
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted/50">
          Wellness BI &middot; Agency Dashboard
        </p>
      </div>
    </div>
  );
}
