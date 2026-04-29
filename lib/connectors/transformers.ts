// ==========================================
// Slug → transformer map (used by orchestrator for mock-mode)
// ==========================================
// Pure dispatch — no side effects. Each transformer accepts its own raw shape
// (typed as unknown here, narrowed inside the transformer) and returns the
// universal ConnectorResponse.

import type { ConnectorResponse } from '@/types';
import { transformData as transformStripe } from '@/modules/stripe/transformer';
import { transformData as transformSquare } from '@/modules/square/transformer';
import { transformData as transformMeta } from '@/modules/meta/transformer';
import { transformData as transformTikTok } from '@/modules/tiktok/transformer';
import { transformData as transformYelp } from '@/modules/yelp/transformer';
import { transformData as transformGA } from '@/modules/google-analytics/transformer';
import { transformData as transformBank } from '@/modules/bank/transformer';

type AnyTransformer = (raw: unknown) => ConnectorResponse;

export const transformersBySlug: Record<string, AnyTransformer> = {
  stripe: (raw) => transformStripe(raw as Parameters<typeof transformStripe>[0]),
  square: (raw) => transformSquare(raw as Parameters<typeof transformSquare>[0]),
  meta: (raw) => transformMeta(raw as Parameters<typeof transformMeta>[0]),
  tiktok: (raw) => transformTikTok(raw as Parameters<typeof transformTikTok>[0]),
  yelp: (raw) => transformYelp(raw as Parameters<typeof transformYelp>[0]),
  'google-analytics': (raw) => transformGA(raw as Parameters<typeof transformGA>[0]),
  bank: (raw) => transformBank(raw as Parameters<typeof transformBank>[0]),
};

export function getTransformer(slug: string): AnyTransformer | undefined {
  return transformersBySlug[slug];
}
