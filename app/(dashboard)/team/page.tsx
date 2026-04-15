'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { Mail, Trash2, UserPlus, CheckCircle2, Clock } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  invitedAt: string | null;
  confirmed: boolean;
}

export default function TeamPage() {
  const { toast } = useToast();
  const { data, isLoading, mutate } = useSWR<{ data: TeamMember[] }>(
    '/api/team',
    fetcher
  );

  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const members = data?.data ?? [];

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (json.status === 'error') {
        toast(json.error || 'Failed to send invite', 'error');
      } else {
        toast(`Invite sent to ${email}`, 'success');
        setEmail('');
        mutate();
      }
    } catch {
      toast('Network error', 'error');
    }
    setInviting(false);
  }

  async function handleRemove(member: TeamMember) {
    if (!confirm(`Remove ${member.email} from the team? This revokes their access immediately.`)) {
      return;
    }
    setRemoving(member.id);
    try {
      const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.status === 'error') {
        toast(json.error || 'Failed to remove user', 'error');
      } else {
        toast(`${member.email} removed`, 'success');
        mutate();
      }
    } catch {
      toast('Network error', 'error');
    }
    setRemoving(null);
  }

  function formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <PageWrapper title="Team">
      <div className="max-w-3xl space-y-6">
        <p className="text-sm text-text-muted">
          Invite teammates by email. They will receive a secure link to set their password.
          Only invited members can sign in — public signup is disabled.
        </p>

        {/* Invite form */}
        <form
          onSubmit={handleInvite}
          className="rounded-2xl border border-surface-border bg-surface-card p-5 animate-fade-in"
        >
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <UserPlus className="h-4 w-4 text-accent" />
            Invite a new team member
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                required
                placeholder="teammate@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-surface-border bg-surface pl-9 pr-3 py-2.5 text-sm text-text-primary placeholder-text-muted transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                disabled={inviting}
              />
            </div>
            <Button type="submit" disabled={inviting} className="glow-orange-sm">
              {inviting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending...
                </span>
              ) : (
                'Send invite'
              )}
            </Button>
          </div>
        </form>

        {/* Members list */}
        <div className="rounded-2xl border border-surface-border bg-surface-card overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
            <h3 className="text-sm font-semibold text-text-primary">
              Members {members.length > 0 && <span className="text-text-muted">· {members.length}</span>}
            </h3>
          </div>

          {isLoading ? (
            <div className="p-5 text-sm text-text-muted">Loading team...</div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-sm text-text-muted">No team members yet.</div>
          ) : (
            <ul className="divide-y divide-surface-border">
              {members.map((m, i) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-subtle/50 animate-slide-up"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                      {m.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{m.email}</p>
                      <p className="text-xs text-text-muted">
                        {m.confirmed ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-400" />
                            Active · last sign in {formatDate(m.lastSignInAt)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-400" />
                            Invited {formatDate(m.invitedAt ?? m.createdAt)} · awaiting first sign in
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(m)}
                    disabled={removing === m.id}
                    className="flex flex-none items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-text-muted transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {removing === m.id ? 'Removing...' : 'Remove'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
