import type { TemplateRegistryEntry } from '../lib/interfaces'
import { registerInternalTemplates } from '../lib/template-registry'
import { normalizeRecord as quoteNormalizeRecord } from '../data/quote-detail/normalize-record'

const BUILT_IN_TEMPLATES: TemplateRegistryEntry[] = [
  {
    id: 'sales-offer',
    label: 'Sales Offer',
    description: 'Professional sales offer.',
    category: 'quote',
    tags: ['offer', 'sales'],
    moduleId: 'quotes',
    fromRecord: quoteNormalizeRecord,
    load: () => import('../templates/sales-offer').then((m) => m.SalesOfferDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>),
  },
]

registerInternalTemplates(BUILT_IN_TEMPLATES)

// Keep REGISTRY export for TemplateId type derivation
export const REGISTRY = BUILT_IN_TEMPLATES
