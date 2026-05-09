import '../config/registry' // registers built-in templates as side effect
import { getAllTemplates } from './template-registry'
import type { TemplateMeta, PdfTemplateDefinition } from './interfaces'

export type { TemplateMeta, PdfTemplateDefinition }
export type { TemplateId } from './types'

export function getTemplateMetas(): TemplateMeta[] {
  return getAllTemplates().map(({ id, label, description, category, tags, moduleId }) => ({ id, label, description, category, tags, moduleId }))
}

export async function loadTemplate(id: string, record: unknown): Promise<PdfTemplateDefinition & { data: Record<string, unknown> }> {
  const entry = getAllTemplates().find((t) => t.id === id)
  if (!entry) throw new Error(`Unknown template: ${id}`)
  const component = await entry.load()
  const data = entry.fromRecord(record)
  return { id: entry.id, label: entry.label, description: entry.description, category: entry.category, tags: entry.tags, moduleId: entry.moduleId, component, data }
}
