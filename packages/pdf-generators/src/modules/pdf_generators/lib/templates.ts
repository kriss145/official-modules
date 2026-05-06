import type { PdfTemplateDefinition } from './types'

export type TemplateId = 'codee-offer'

export interface TemplateMeta {
  id: TemplateId
  label: string
  description: string
}

export function getTemplateMetas(): TemplateMeta[] {
  return [
    {
      id: 'codee-offer',
      label: 'Codee Sales Offer',
      description: 'Profesjonalna oferta handlowa w stylu Codee. Strona tytułowa + tabela pozycji.',
    },
  ]
}

export async function loadTemplate(id: TemplateId): Promise<PdfTemplateDefinition> {
  const meta = getTemplateMetas().find((t) => t.id === id)
  if (!meta) throw new Error(`Unknown template: ${id}`)

  if (id === 'codee-offer') {
    const { CodeeOfferDocument } = await import('../templates/codee-offer')
    return { ...meta, component: CodeeOfferDocument }
  }

  throw new Error(`Template loader not implemented for: ${id}`)
}
