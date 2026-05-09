import type { TemplateRegistryEntry } from '../lib/interfaces'
import { templateRegistry } from '../lib/template-registry'
import { normalizeRecord as quoteNormalizeRecord } from '../templates/sales/quotes/data/normalize-record'

const BUILT_IN_TEMPLATES: TemplateRegistryEntry[] = [
  {
    id: 'sales-offer',
    label: 'Sales Offer',
    description: 'Professional sales offer.',
    category: 'quote',
    tags: ['offer', 'sales'],
    moduleId: 'quotes',
    fromRecord: quoteNormalizeRecord,
    load: () => import('../templates/sales/quotes/templates/sales-offer').then((m) => m.SalesOfferDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>),
  },
]

templateRegistry.registerInternal(BUILT_IN_TEMPLATES)

/** Exported for TemplateId type derivation — not intended for runtime use. */
export const REGISTRY = BUILT_IN_TEMPLATES
