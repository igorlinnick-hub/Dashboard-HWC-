import {
  Landmark,
  CreditCard,
  SquareIcon,
  Megaphone,
  Star,
  Music,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

/** Map connector slug → Lucide icon component */
export const connectorIcons: Record<string, LucideIcon> = {
  bank: Landmark,
  stripe: CreditCard,
  square: SquareIcon,
  meta: Megaphone,
  yelp: Star,
  tiktok: Music,
  'google-analytics': BarChart3,
};

export function getConnectorIcon(slug: string): LucideIcon {
  return connectorIcons[slug] ?? BarChart3;
}
