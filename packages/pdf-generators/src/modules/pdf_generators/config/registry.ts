import type { TemplateRegistryEntry } from '../lib/interfaces'
import { registerInternalTemplates } from '../lib/template-registry'
import { fromRecord as quoteFromRecord } from '../data/quote-detail/from-record'

const BUILT_IN_TEMPLATES: TemplateRegistryEntry[] = [
  {
    id: 'sales-offer',
    label: 'Sales Offer',
    description: 'Professional sales offer. Cover page + line items table.',
    category: 'quote',
    tags: ['offer', 'sales'],
    moduleId: 'quotes',
    fromRecord: quoteFromRecord,
    load: () => import('../templates/sales-offer').then((m) => m.SalesOfferDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>),
  },
]

registerInternalTemplates(BUILT_IN_TEMPLATES)

// Keep REGISTRY export for TemplateId type derivation
export const REGISTRY = BUILT_IN_TEMPLATES
