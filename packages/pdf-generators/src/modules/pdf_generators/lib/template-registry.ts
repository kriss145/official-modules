import type { AppContainer } from '@open-mercato/shared/lib/di/container'
import type { TemplateMeta, TemplateEntry, TemplateRegistry as TemplateRegistryInterface, LoadedTemplate } from './interfaces'

class TemplateRegistry implements TemplateRegistryInterface {
  private internal: TemplateEntry[] = []
  private external: TemplateEntry[] = []

  registerInternal(entries: TemplateEntry[]): void {
    this.internal = entries
  }

  registerExternal(entries: TemplateEntry[]): void {
    this.external = entries
  }

  getInternal(): TemplateEntry[] {
    return this.internal
  }

  getExternal(): TemplateEntry[] {
    return this.external
  }

  getAll(): TemplateEntry[] {
    return [...this.getInternal(), ...this.getExternal()]
  }

  listTemplates(): { internal: TemplateMeta[]; external: TemplateMeta[] } {
    const toMeta = ({ id, label, description, category, tags, moduleId }: TemplateEntry): TemplateMeta =>
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
  private findTemplate(id: string): TemplateEntry {
    const entry = this.getAll().find((template) => template.id === id)
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
  private async enrich({ id, data }: { id: string; data: unknown }, { container }: { container: AppContainer }): Promise<unknown> {
    const entry = this.findTemplate(id)
    if (!entry.fetchData) return data
    return entry.fetchData({ data }, { container })
  }

  /**
   * Fetches data, normalizes the record, and lazy-loads the component in one call.
   *
   * @param id - Template ID
   * @param record - Raw record from the widget (only `id` is required when fetchData is defined)
   * @param container - Request-scoped DI container; omit to skip fetchData
   * @throws Error if template ID is not registered
   */
  async load({ id, data: rawData }: { id: string; data: unknown }, { container }: { container: AppContainer }): Promise<LoadedTemplate> {
    const entry = this.findTemplate(id)
    const enriched = await this.enrich({ id, data: rawData }, { container })
    const component = await entry.load()
    const data = entry.fromRecord(enriched)
    const filename = entry.filename({ data })
    return { component, data, filename }
  }
}

/** Singleton registry for PDF templates — use this to register, query, and load templates. */
export const templateRegistry = new TemplateRegistry()
