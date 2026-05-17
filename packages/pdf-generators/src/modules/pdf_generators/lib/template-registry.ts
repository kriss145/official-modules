import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import type { TemplateMeta, TemplateRegistryEntry, PdfTemplateDefinition } from './interfaces'

export interface LoadedTemplate extends PdfTemplateDefinition {
  data: Record<string, unknown>
}

class TemplateRegistry {
  // split into two lists so getMetas can report provenance (built-in vs user-registered)
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

  /**
   * Looks up a template entry by ID.
   *
   * @param id - Template ID
   * @throws Error if template is not registered
   */
  private findTemplate(id: string): TemplateRegistryEntry {
    const entry = this.getAll().find((t) => t.id === id)
    if (!entry) throw new Error(`Unknown template: ${id}`)
    return entry
  }

  /**
   * Calls the template's fetchData hook if defined; returns the original record otherwise.
   *
   * @param id - Template ID
   * @param record - Raw record from the widget
   * @param container - Request-scoped DI container passed to fetchData
   */
  private async enrich(id: string, record: unknown, container: AppContainer): Promise<unknown> {
    const entry = this.findTemplate(id)
    if (!entry.fetchData) return record
    return entry.fetchData({ record }, { container })
  }

  /**
   * Fetches data, normalizes the record, and lazy-loads the component in one call.
   *
   * @param id - Template ID
   * @param record - Raw record from the widget (only `id` is required when fetchData is defined)
   * @param container - Request-scoped DI container; omit to skip fetchData
   * @throws Error if template ID is not registered
   */
  async load({ id, record }: { id: string; record: unknown }, { container }: { container?: AppContainer } = {}): Promise<LoadedTemplate> {
    const entry = this.findTemplate(id)
    const enriched = container ? await this.enrich(id, record, container) : record
    const component = await entry.load()
    const data = entry.fromRecord(enriched)
    return { id: entry.id, label: entry.label, description: entry.description, category: entry.category, tags: entry.tags, moduleId: entry.moduleId, component, data }
  }
}

/** Singleton registry for PDF templates — use this to register, query, and load templates. */
export const templateRegistry = new TemplateRegistry()
