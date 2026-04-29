import type { ConnectorAdapter } from '@/types';
import { fetchData } from './fetcher';
import { transformData } from './transformer';
import { classifyBankError } from './errors';

export const bankAdapter: ConnectorAdapter = async ({ creds, period }) => {
  if (!creds.api_key) {
    return {
      status: 'error',
      code: 'NOT_CONNECTED',
      error: 'Bank (Plaid) credentials missing access_token',
    };
  }
  try {
    const raw = await fetchData(creds.api_key, period.from, period.to);
    return { status: 'ok', data: transformData(raw) };
  } catch (err) {
    return classifyBankError(err);
  }
};
