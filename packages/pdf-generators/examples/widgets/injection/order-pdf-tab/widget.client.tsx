'use client'

import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { TemplatesList } from '@open-mercato/pdf-generators'

interface OrderWidgetContext {
  kind: string
  resourceId: string
  resourceKind: string
  record: Record<string, unknown>
}

/**
 * Renders the PDF template list inside the order detail tab.
 *
 * filter.category   — shows only templates registered under this category
 * filter.moduleId   — shows only templates registered by this module
 *
 * Both filters together prevent templates from other modules leaking into this tab.
 */
export default function OrderPdfTabWidget({ context }: InjectionWidgetComponentProps) {
  const ctx = context as OrderWidgetContext
  const record = ctx?.record

  if (!record) return null

  return (
    <div className="border rounded-lg p-4">
      <TemplatesList
        record={record}
        filter={{ category: 'invoice', moduleId: 'example' }}
      />
    </div>
  )
}
