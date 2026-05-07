import '../config/registry' // registers built-in templates as side effect
import { getAllTemplates } from './template-registry'
import type { TemplateMeta, PdfTemplateDefinition } from './interfaces'

export type { TemplateMeta, PdfTemplateDefinition }
export type { TemplateId } from './types'

export function getTemplateMetas(): TemplateMeta[] {
  return getAllTemplates().map(({ id, label, description }) => ({ id, label, description }))
}

export async function loadTemplate(id: string): Promise<PdfTemplateDefinition> {
  const entry = getAllTemplates().find((t) => t.id === id)
  if (!entry) throw new Error(`Unknown template: ${id}`)
  const component = await entry.load()
  return { id: entry.id, label: entry.label, description: entry.description, component }
}
