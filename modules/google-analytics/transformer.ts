import type { GAData } from './types';

/** Normalize raw GA4 API response into our GAData shape */
export function transformData(raw: unknown): GAData {
  // TODO: parse dimension/metric pairs from GA4 report format
  return raw as GAData;
}
