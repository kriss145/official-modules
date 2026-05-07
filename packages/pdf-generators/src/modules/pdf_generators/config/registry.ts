import type { TemplateRegistryEntry } from '../lib/interfaces'

export const REGISTRY: TemplateRegistryEntry[] = [
  {
    id: 'codee-offer',
    label: 'Codee Sales Offer',
    description: 'Profesjonalna oferta handlowa w stylu Codee. Strona tytułowa + tabela pozycji.',
    load: () => import('../templates/codee-offer').then((m) => m.CodeeOfferDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>),
  },
]
