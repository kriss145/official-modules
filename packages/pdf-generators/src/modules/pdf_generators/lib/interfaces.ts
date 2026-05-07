export interface TemplateMeta {
  id: string
  label: string
  description: string
}

export interface TemplateRegistryEntry extends TemplateMeta {
  load: () => Promise<React.ComponentType<{ data: Record<string, unknown> }>>
}

export interface PdfTemplateDefinition extends TemplateMeta {
  component: React.ComponentType<{ data: Record<string, unknown> }>
}
