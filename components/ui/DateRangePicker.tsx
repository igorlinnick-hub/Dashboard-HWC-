'use client';

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Calendar, ChevronDown } from 'lucide-react';

interface Preset {
  label: string;
  from: string;
  to: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function buildPresets(): Preset[] {
  const now = new Date();
  const today = formatDate(now);

  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return formatDate(d);
  };

  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return [
    { label: 'Last 7 days', from: daysAgo(7), to: today },
    { label: 'Last 30 days', from: daysAgo(30), to: today },
    { label: 'Last 90 days', from: daysAgo(90), to: today },
    { label: 'This month', from: formatDate(startOfMonth(now)), to: today },
    { label: 'Last month', from: formatDate(startOfMonth(prevMonth)), to: formatDate(endOfMonth(prevMonth)) },
  ];
}

export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const presets = useMemo(() => buildPresets(), []);

  const currentFrom = searchParams.get('from');
  const currentTo = searchParams.get('to');

  const activeLabel = useMemo(() => {
    if (!currentFrom || !currentTo) return 'Last 30 days';
    const match = presets.find((p) => p.from === currentFrom && p.to === currentTo);
    return match?.label ?? `${currentFrom} — ${currentTo}`;
  }, [currentFrom, currentTo, presets]);

  const selectPreset = useCallback(
    (preset: Preset) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('from', preset.from);
      params.set('to', preset.to);
      router.push(`${pathname}?${params.toString()}`);
      setOpen(false);
    },
    [router, pathname, searchParams]
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-sm text-text-secondary transition-colors hover:border-surface-subtle hover:text-text-primary"
      >
        <Calendar className="h-3.5 w-3.5" />
        <span>{activeLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-surface-border bg-surface-card py-1 shadow-lg">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => selectPreset(preset)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover ${
                activeLabel === preset.label ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
