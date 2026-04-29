import type { ConnectorAdapter } from '@/types';
import { fetchData } from './fetcher';
import { transformData } from './transformer';
import { classifyMetaError } from './errors';

export const metaAdapter: ConnectorAdapter = async ({ creds, period }) => {
  const accountId = creds.extra_config?.account_id as string | undefined;

  if (!creds.api_key || !accountId) {
    return {
      status: 'error',
      code: 'NOT_CONNECTED',
      error: 'Meta credentials missing api_key or account_id',
    };
  }
  try {
    const raw = await fetchData(creds.api_key, accountId, period.from, period.to);
    return { status: 'ok', data: transformData(raw) };
  } catch (err) {
    return classifyMetaError(err);
  }
};
