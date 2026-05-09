export { metadata } from './modules/pdf_generators/index'

// Public API for external template authors
export { templateRegistry } from './modules/pdf_generators/lib/template-registry'
export type { TemplateRegistryEntry, TemplateMeta, TemplateFilter } from './modules/pdf_generators/lib/interfaces'
export type { QuoteWidgetRecord } from './modules/pdf_generators/templates/sales/quotes/data/types'
