import type { ConnectorAdapter } from '@/types';
import { fetchData } from './fetcher';
import { transformData } from './transformer';
import { classifyGAError } from './errors';

export const gaAdapter: ConnectorAdapter = async ({ creds, period }) => {
  const propertyId = creds.extra_config?.property_id as string | undefined;

  if (!creds.api_key) {
    return {
      status: 'error',
      code: 'NOT_CONNECTED',
      error: 'Google Analytics credentials missing refresh token',
    };
  }
  if (!propertyId) {
    return {
      status: 'error',
      code: 'INVALID_KEY',
      error: 'Missing GA4 property_id in credentials',
    };
  }
  try {
    const raw = await fetchData(creds.api_key, propertyId, period.from, period.to);
    return { status: 'ok', data: transformData(raw) };
  } catch (err) {
    return classifyGAError(err);
  }
};
