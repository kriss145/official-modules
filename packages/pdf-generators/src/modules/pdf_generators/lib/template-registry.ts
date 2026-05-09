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

  /**
   * Normalizes the raw record via entry.fromRecord, then loads and returns the template component.
   *
   * @param id - Template ID
   * @param record - Raw record from the server
   * @returns Loaded template with normalized data
   * @throws Error if template ID is not found in the registry
   */
  async load(id: string, record: unknown): Promise<LoadedTemplate> {
    const entry = this.getAll().find((t) => t.id === id)
    if (!entry) throw new Error(`Unknown template: ${id}`)
    const component = await entry.load()
    const data = entry.fromRecord(record)
    return { id: entry.id, label: entry.label, description: entry.description, category: entry.category, tags: entry.tags, moduleId: entry.moduleId, component, data }
  }
}

/** Singleton registry for PDF templates — use this to register, query, and load templates. */
export const templateRegistry = new TemplateRegistry()
