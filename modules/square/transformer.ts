import type { SquareData } from './types';

/** Normalize raw Square API response into our SquareData shape */
export function transformData(raw: unknown): SquareData {
  // TODO: parse and normalize raw Square API response
  return raw as SquareData;
}
