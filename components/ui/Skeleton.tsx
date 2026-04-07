'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-surface-subtle via-surface-border to-surface-subtle bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
