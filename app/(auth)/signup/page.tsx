'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { LayoutDashboard } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/');
  }

  const inputClass =
    'block w-full rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-muted transition-all duration-200';

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm px-4"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent glow-orange">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
          <p className="mt-1 text-sm text-text-muted">Get started with your agency dashboard</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card">
          <div className="h-0.5 bg-gradient-to-r from-accent via-accent-hover to-accent" />
          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Email
                </label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@company.com" required />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Password
                </label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Min. 6 characters" required />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-text-secondary">
                  Confirm Password
                </label>
                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Repeat your password" required />
              </div>
              <Button type="submit" className="w-full glow-orange-sm" size="lg" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-text-muted">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-accent hover:text-accent-hover transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
