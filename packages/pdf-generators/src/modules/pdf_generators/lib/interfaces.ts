export interface TemplateMeta {
  id: string
  label: string
  description: string
  category: string
  tags: string[]
  moduleId: string
}

export interface TemplateRegistryEntry extends TemplateMeta {
  fromRecord: (record: unknown) => Record<string, unknown>
  load: () => Promise<React.ComponentType<{ data: Record<string, unknown> }>>
}

export interface PdfTemplateDefinition extends TemplateMeta {
  component: React.ComponentType<{ data: Record<string, unknown> }>
}

export interface TemplateFilter {
  category?: string
  tags?: string[]
  moduleId?: string
}
