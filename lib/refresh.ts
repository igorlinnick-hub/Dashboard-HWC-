// ==========================================
// Data refresh scheduler
// ==========================================

const intervals = new Map<string, NodeJS.Timeout>();

/**
 * Schedule periodic refresh for a connector.
 * TODO: will trigger re-fetch of connector data via API route
 */
export function scheduleRefresh(connectorSlug: string, clientId: string, intervalSeconds: number): void {
  const key = `${clientId}:${connectorSlug}`;
  const existing = intervals.get(key);
  if (existing) clearInterval(existing);

  const id = setInterval(() => {
    // TODO: call /api/clients/[clientId]/connectors/[slug]/data to trigger re-fetch
    // fetch(`/api/clients/${clientId}/connectors/${connectorSlug}/data`);
  }, intervalSeconds * 1000);

  intervals.set(key, id);
}

/** Stop refresh for a connector. */
export function stopRefresh(connectorSlug: string, clientId: string): void {
  const key = `${clientId}:${connectorSlug}`;
  const id = intervals.get(key);
  if (id) {
    clearInterval(id);
    intervals.delete(key);
  }
}
