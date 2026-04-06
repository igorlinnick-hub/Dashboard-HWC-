import type { MetaData } from './types';

/** Normalize raw Meta API response into our MetaData shape */
export function transformData(raw: unknown): MetaData {
  // TODO: parse string values to numbers, extract conversions from actions array
  return raw as MetaData;
}
