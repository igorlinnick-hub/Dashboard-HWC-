import type { BankData } from './types';

/** Normalize raw Plaid API response into our BankData shape */
export function transformData(raw: unknown): BankData {
  // TODO: parse and normalize raw Plaid API response
  // For now, pass through assuming it matches our type
  return raw as BankData;
}
