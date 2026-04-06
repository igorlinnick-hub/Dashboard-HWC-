// ==========================================
// Simple in-memory cache with TTL
// ==========================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // timestamp ms
}

const store = new Map<string, CacheEntry<unknown>>();

/** Get a cached value by key. Returns null if expired or missing. */
export function get<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value as T;
}

/** Set a cached value with TTL in seconds. */
export function set<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/** Clear all cache entries. */
export function clear(): void {
  store.clear();
}
