import type { TemplateMeta, TemplateRegistryEntry, PdfTemplateDefinition } from './interfaces'

export type { TemplateMeta, PdfTemplateDefinition }
export type { TemplateId } from './types'

export interface LoadedTemplate extends PdfTemplateDefinition {
  data: Record<string, unknown>
}

class TemplateRegistry {
  private internal: TemplateRegistryEntry[] = []
  private external: TemplateRegistryEntry[] = []

  registerInternal(entries: TemplateRegistryEntry[]): void {
    this.internal = entries
  }

  registerExternal(entries: TemplateRegistryEntry[]): void {
    this.external = entries
  }

  getInternal(): TemplateRegistryEntry[] {
    return this.internal
  }

  getExternal(): TemplateRegistryEntry[] {
    return this.external
  }

  getAll(): TemplateRegistryEntry[] {
    return [...this.getInternal(), ...this.getExternal()]
  }

  getMetas(): { internal: TemplateMeta[]; external: TemplateMeta[] } {
    const toMeta = ({ id, label, description, category, tags, moduleId }: TemplateRegistryEntry): TemplateMeta =>
      ({ id, label, description, category, tags, moduleId })
    return {
      internal: this.getInternal().map(toMeta),
      external: this.getExternal().map(toMeta),
    }
  }

  async load(id: string, record: unknown): Promise<LoadedTemplate> {
    const entry = this.getAll().find((t) => t.id === id)
    if (!entry) throw new Error(`Unknown template: ${id}`)
    const component = await entry.load()
    const data = entry.fromRecord(record)
    return { id: entry.id, label: entry.label, description: entry.description, category: entry.category, tags: entry.tags, moduleId: entry.moduleId, component, data }
  }
}

export const templateRegistry = new TemplateRegistry()
