import type { TemplateMeta, TemplateRegistryEntry, PdfTemplateDefinition } from './interfaces'

export type { TemplateMeta, PdfTemplateDefinition }
export type { TemplateId } from './types'

export interface LoadedTemplate extends PdfTemplateDefinition {
  data: Record<string, unknown>
}

/**
 * Holds all registered PDF templates and resolves them for rendering.
 */
class TemplateRegistry {
  private internal: TemplateRegistryEntry[] = []
  private external: TemplateRegistryEntry[] = []

  /**
   * Replaces all internal templates.
   *
   * @param entries - Internal template registry entries
   */
  registerInternal(entries: TemplateRegistryEntry[]): void {
    this.internal = entries
  }

  /**
   * Replaces all external templates.
   *
   * @param entries - External template registry entries
   */
  registerExternal(entries: TemplateRegistryEntry[]): void {
    this.external = entries
  }

  /**
   * Returns all internal templates.
   *
   * @returns Array of internal template registry entries
   */
  getInternal(): TemplateRegistryEntry[] {
    return this.internal
  }

  /**
   * Returns all external templates.
   *
   * @returns Array of external template registry entries
   */
  getExternal(): TemplateRegistryEntry[] {
    return this.external
  }

  /**
   * Returns all registered templates (internal + external).
   *
   * @returns Combined array of internal and external template registry entries
   */
  getAll(): TemplateRegistryEntry[] {
    return [...this.getInternal(), ...this.getExternal()]
  }

  /**
   * Returns metadata for all registered templates grouped by source.
   *
   * @returns Object with `internal` and `external` arrays of template metadata
   */
  getMetas(): { internal: TemplateMeta[]; external: TemplateMeta[] } {
    const toMeta = ({ id, label, description, category, tags, moduleId }: TemplateRegistryEntry): TemplateMeta =>
      ({ id, label, description, category, tags, moduleId })
    return {
      internal: this.getInternal().map(toMeta),
      external: this.getExternal().map(toMeta),
    }
  }

  private findTemplate(id: string): TemplateRegistryEntry {
    const entry = this.getAll().find((t) => t.id === id)
    if (!entry) throw new Error(`Unknown template: ${id}`)
    return entry
  }

  /**
   * Fetches related data for the given template via the DI container.
   * Returns the original record unchanged if the template defines no fetchData hook.
   *
   * @param id - Template ID
   * @param record - Raw record from the widget context
   * @param container - Request-scoped Awilix DI container
   */
  private async enrich(id: string, record: unknown, container: unknown): Promise<unknown> {
    const entry = this.findTemplate(id)
    if (!entry.fetchData) return record
    return entry.fetchData(record, container)
  }

  /**
   * Normalizes a (possibly enriched) record into the flat data shape expected by the template.
   *
   * @param id - Template ID
   * @param record - Record from the widget context (already enriched if needed)
   */
  normalize(id: string, record: unknown): Record<string, unknown> {
    return this.findTemplate(id).fromRecord(record)
  }

  /**
   * Lazy-loads the React-PDF component for the given template.
   *
   * @param id - Template ID
   */
  async loadComponent(id: string): Promise<LoadedTemplate['component']> {
    return this.findTemplate(id).load()
  }

  /**
   * Enrich → normalize → load component in one call.
   * Pass container to trigger fetchData; omit it to skip enrichment.
   *
   * @param id - Template ID
   * @param record - Raw record from the widget context
   * @param container - Request-scoped Awilix DI container (optional)
   */
  async load(id: string, record: unknown, container?: unknown): Promise<LoadedTemplate> {
    const entry = this.findTemplate(id)
    const enriched = container ? await this.enrich(id, record, container) : record
    const component = await entry.load()
    const data = entry.fromRecord(enriched)
    return { id: entry.id, label: entry.label, description: entry.description, category: entry.category, tags: entry.tags, moduleId: entry.moduleId, component, data }
  }
}

/** Singleton registry for PDF templates — use this to register, query, and load templates. */
export const templateRegistry = new TemplateRegistry()
