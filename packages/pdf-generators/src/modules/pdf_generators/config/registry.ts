import type { TemplateRegistryEntry } from '../lib/interfaces'

export const REGISTRY: TemplateRegistryEntry[] = [
  {
    id: 'sales-offer',
    label: 'Sales Offer',
    description: 'Professional sales offer. Cover page + line items table.',
    load: () => import('../templates/sales-offer').then((m) => m.SalesOfferDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>),
  },
]
