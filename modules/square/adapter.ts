import type { ConnectorAdapter } from '@/types';
import { fetchData } from './fetcher';
import { transformData } from './transformer';
import { classifySquareError } from './errors';

export const squareAdapter: ConnectorAdapter = async ({ creds, period }) => {
  const accessToken = creds.extra_config?.access_token as string | undefined;
  const locationId = creds.extra_config?.location_id as string | undefined;

  if (!accessToken || !locationId) {
    return {
      status: 'error',
      code: 'NOT_CONNECTED',
      error: 'Square credentials missing access_token or location_id',
    };
  }
  try {
    const raw = await fetchData(accessToken, locationId, period.from, period.to);
    return { status: 'ok', data: transformData(raw) };
  } catch (err) {
    return classifySquareError(err);
  }
};
