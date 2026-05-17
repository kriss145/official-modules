import type { AppContainer } from '@open-mercato/shared/lib/di/container'

/**
 * Minimal metadata for a PDF template — used in listings and filtering.
 */
export interface TemplateMeta {
  id: string
  label: string
  description: string
  category: string
  tags: string[]
  moduleId: string
}

/**
 * Full registry entry — extends metadata with runtime loading and data normalization.
 */
export interface TemplateRegistryEntry extends TemplateMeta {
  fromRecord: (record: unknown) => Record<string, unknown> // maps raw server record to the template data shape
  load: () => Promise<React.ComponentType<{ data: Record<string, unknown> }>> // lazy-loaded React-PDF component
  fetchData?: (input: { record: unknown }, ctx: { container: AppContainer }) => Promise<unknown> // optional: fetch related data server-side before normalization
}

/**
 * Resolved template ready for rendering — component is already loaded.
 */
export interface PdfTemplateDefinition extends TemplateMeta {
  component: React.ComponentType<{ data: Record<string, unknown> }>
}

/**
 * Optional filter criteria for querying templates from the registry.
 */
export interface TemplateFilter {
  category?: string
  tags?: string[]
  moduleId?: string
}
