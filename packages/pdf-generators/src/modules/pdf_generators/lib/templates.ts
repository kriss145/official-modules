interface TemplateRegistryEntry {
  id: string
  label: string
  description: string
  load: () => Promise<React.ComponentType<{ data: Record<string, unknown> }>>
}

const REGISTRY: TemplateRegistryEntry[] = [
  {
    id: 'codee-offer',
    label: 'Codee Sales Offer',
    description: 'Profesjonalna oferta handlowa w stylu Codee. Strona tytułowa + tabela pozycji.',
    load: () => import('../templates/codee-offer').then((m) => m.CodeeOfferDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>),
  },
]

export type TemplateId = (typeof REGISTRY)[number]['id']

export interface TemplateMeta {
  id: string
  label: string
  description: string
}

export interface PdfTemplateDefinition extends TemplateMeta {
  component: React.ComponentType<{ data: Record<string, unknown> }>
}

export function getTemplateMetas(): TemplateMeta[] {
  return REGISTRY.map(({ id, label, description }) => ({ id, label, description }))
}

export async function loadTemplate(id: string): Promise<PdfTemplateDefinition> {
  const entry = REGISTRY.find((t) => t.id === id)
  if (!entry) throw new Error(`Unknown template: ${id}`)
  const component = await entry.load()
  return { id: entry.id, label: entry.label, description: entry.description, component }
}
