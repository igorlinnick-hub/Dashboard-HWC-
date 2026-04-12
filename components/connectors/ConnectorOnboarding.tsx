'use client';

import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConnectModal } from '@/components/connectors/ConnectModal';
import type { ConnectorDefinition } from '@/types';

interface PreviewMetric {
  label: string;
  target: number;
  prefix?: string;
  suffix?: string;
}

interface OnboardingConfig {
  description: string;
  bullets: string[];
  metrics: PreviewMetric[];
}

const CONFIG: Record<string, OnboardingConfig> = {
  stripe: {
    description: 'See your Stripe revenue and subscription data in real time.',
    bullets: ['Monthly revenue, MRR & refund tracking', 'Daily transaction trends', 'Top products by revenue'],
    metrics: [
      { label: 'Revenue', target: 24800, prefix: '$' },
      { label: 'Transactions', target: 312 },
      { label: 'MRR', target: 8400, prefix: '$' },
      { label: 'Refunds', target: 7 },
    ],
  },
  square: {
    description: 'See your Square payment data and sales trends in real time.',
    bullets: ['Gross sales & net revenue', 'Payment method breakdown', 'Busiest hours heatmap'],
    metrics: [
      { label: 'Gross Sales', target: 18600, prefix: '$' },
      { label: 'Transactions', target: 247 },
      { label: 'Avg Ticket', target: 75, prefix: '$' },
      { label: 'Refunds', target: 4 },
    ],
  },
  yelp: {
    description: 'Monitor your Yelp reputation and new reviews in real time.',
    bullets: ['Star rating & total review count', 'New reviews in the last 30 days', 'Recent review feed'],
    metrics: [
      { label: 'Rating', target: 48, suffix: '/5', prefix: '' },
      { label: 'Total Reviews', target: 184 },
      { label: 'New (30d)', target: 12 },
      { label: 'Avg Score', target: 46, suffix: '/5' },
    ],
  },
  meta: {
    description: 'See your Meta Ads performance and campaign ROI in real time.',
    bullets: ['Total ad spend & impressions', 'CTR and conversion tracking', 'Campaign-level breakdown'],
    metrics: [
      { label: 'Ad Spend', target: 3200, prefix: '$' },
      { label: 'Impressions', target: 94000 },
      { label: 'CTR', target: 34, suffix: '%' },
      { label: 'Conversions', target: 68 },
    ],
  },
  tiktok: {
    description: 'See your TikTok Ads reach and video performance in real time.',
    bullets: ['Total spend & video views', 'Conversion and click tracking', 'Campaign performance breakdown'],
    metrics: [
      { label: 'Ad Spend', target: 1800, prefix: '$' },
      { label: 'Video Views', target: 52000 },
      { label: 'Conversions', target: 43 },
      { label: 'Impressions', target: 71000 },
    ],
  },
  'google-analytics': {
    description: 'See your website traffic and user behavior in real time.',
    bullets: ['Sessions, users & bounce rate', 'Daily traffic trends', 'Top traffic channels'],
    metrics: [
      { label: 'Sessions', target: 4200 },
      { label: 'Users', target: 3100 },
      { label: 'Bounce Rate', target: 38, suffix: '%' },
      { label: 'Avg Duration', target: 214, suffix: 's' },
    ],
  },
  bank: {
    description: 'See your bank balances and transaction history in real time.',
    bullets: ['Live account balances', 'Monthly income vs expenses', 'Transaction category breakdown'],
    metrics: [
      { label: 'Balance', target: 42000, prefix: '$' },
      { label: 'Income', target: 18500, prefix: '$' },
      { label: 'Expenses', target: 11200, prefix: '$' },
      { label: 'Transactions', target: 89 },
    ],
  },
};

function useCountUp(target: number, active: boolean, duration = 1400): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    setValue(0);
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [target, active, duration]);

  return value;
}

function PreviewMetricCard({ metric, active, delay }: { metric: PreviewMetric; active: boolean; delay: number }) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [active, delay]);

  const value = useCountUp(metric.target, started);

  function fmt(n: number): string {
    if (n >= 1000) return n.toLocaleString('en-US');
    return String(n);
  }

  // Special case: rating displayed as X.X
  const displayValue = metric.suffix?.includes('/5')
    ? (value / 10).toFixed(1)
    : fmt(value);

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-4 opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}>
      <p className="mb-1 text-xs text-text-muted">{metric.label}</p>
      <p className="text-2xl font-bold text-text-primary tabular-nums">
        {metric.prefix ?? ''}{displayValue}{metric.suffix ?? ''}
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-subtle">
        <div
          className="h-full rounded-full bg-accent transition-all duration-1000"
          style={{ width: started ? '100%' : '0%' }}
        />
      </div>
    </div>
  );
}

interface ConnectorOnboardingProps {
  connector: ConnectorDefinition;
  clientId: string;
  onConnected: () => void;
}

export function ConnectorOnboarding({ connector, clientId, onConnected }: ConnectorOnboardingProps) {
  const [showModal, setShowModal] = useState(false);
  const [animating, setAnimating] = useState(false);
  const config = CONFIG[connector.slug] ?? {
    description: `Connect ${connector.name} to see your data in real time.`,
    bullets: ['Live metrics', 'Historical trends', 'Detailed breakdown'],
    metrics: [
      { label: 'Metric 1', target: 1000 },
      { label: 'Metric 2', target: 500 },
      { label: 'Metric 3', target: 250 },
      { label: 'Metric 4', target: 100 },
    ],
  };

  useEffect(() => {
    const t = setTimeout(() => setAnimating(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>

          {/* Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-muted ring-1 ring-accent/20">
              <span className="text-2xl font-bold text-accent">
                {connector.name.charAt(0)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">{connector.name}</h2>
            <p className="text-text-muted">{config.description}</p>
          </div>

          {/* Animated metric preview */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {config.metrics.map((metric, i) => (
              <PreviewMetricCard
                key={metric.label}
                metric={metric}
                active={animating}
                delay={i * 120}
              />
            ))}
          </div>

          {/* What you'll get */}
          <div className="rounded-xl border border-surface-border bg-surface-card p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              After connecting
            </p>
            <ul className="space-y-2">
              {config.bullets.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Check className="h-4 w-4 shrink-0 text-accent" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowModal(true)}
              className="glow-orange-sm px-8 py-3 text-base font-semibold"
            >
              Connect {connector.name}
            </Button>
          </div>
        </div>
      </div>

      {showModal && (
        <ConnectModal
          connector={connector}
          clientId={clientId}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onConnected();
          }}
        />
      )}
    </>
  );
}
