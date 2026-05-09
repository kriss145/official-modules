import type { TemplateRegistryEntry } from '../lib/interfaces'

/**
 * Registration shape for a single template within a document service.
 * Does not include moduleId or fromRecord — those are supplied by the service itself.
 */
export interface DocumentTemplateEntry {
  id: string
  label: string
  description: string
  category: string
  tags: string[]
  load: () => Promise<React.ComponentType<{ data: Record<string, unknown> }>>
}

/**
 * Base class for document services.
 *
 * Each concrete service owns a set of related templates and the normalization
 * logic for converting raw widget records into the data shape those templates expect.
 * Extend this class once per module (e.g. QuotesDocumentService, InvoicesDocumentService).
 */
export abstract class BaseDocumentService {
  abstract readonly id: string
  abstract readonly label: string
  abstract readonly moduleId: string

  protected templates_: Map<string, DocumentTemplateEntry> = new Map()

  /**
   * Normalizes a raw server record into the flat data shape expected by this service's templates.
   *
   * @param record - Raw record from the widget context
   * @returns Normalized data object passed to the template component
   */
  abstract normalizeRecord(record: unknown): Record<string, unknown>

  /**
   * Registers a template with this service.
   *
   * @param entry - Template definition without moduleId and fromRecord
   */
  registerTemplate(entry: DocumentTemplateEntry): void {
    this.templates_.set(entry.id, entry)
  }

  /**
   * Returns all templates registered with this service as TemplateRegistryEntry objects,
   * with moduleId and fromRecord bound to this service instance.
   *
   * @returns Array of registry entries ready to be passed to templateRegistry
   */
  getEntries(): TemplateRegistryEntry[] {
    return Array.from(this.templates_.values()).map((t) => ({
      id: t.id,
      label: t.label,
      description: t.description,
      category: t.category,
      tags: t.tags,
      moduleId: this.moduleId,
      fromRecord: (record: unknown) => this.normalizeRecord(record),
      load: t.load,
    }))
  }
}
