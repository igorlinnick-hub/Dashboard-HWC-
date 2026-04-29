import type { ConnectorAdapter } from '@/types';
import { fetchData } from './fetcher';
import { transformData } from './transformer';
import { classifyYelpError } from './errors';

export const yelpAdapter: ConnectorAdapter = async ({ creds }) => {
  const businessId = creds.extra_config?.business_id as string | undefined;

  if (!creds.api_key || !businessId) {
    return {
      status: 'error',
      code: 'NOT_CONNECTED',
      error: 'Yelp credentials missing api_key or business_id',
    };
  }
  try {
    const raw = await fetchData(creds.api_key, businessId);
    return { status: 'ok', data: transformData(raw) };
  } catch (err) {
    return classifyYelpError(err);
  }
};
