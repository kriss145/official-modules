'use client'

import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { TemplatesList } from '../../../components/TemplatesList'
import type { QuoteWidgetRecord } from '../../../services'

/**
 * Full widget context passed to the quote PDF widget — wraps the record with routing metadata.
 */
interface QuoteWidgetContext {
  kind: string
  resourceId: string
  resourceKind: string
  record: QuoteWidgetRecord
}

export default function QuotePdfTabWidget({ context }: InjectionWidgetComponentProps) {
  const ctx = context as QuoteWidgetContext
  const record = ctx?.record

  if (!record) return null

  return (
    <div className="border rounded-lg p-4">
      <TemplatesList
        record={record}
        filter={{ category: 'quote', moduleId: 'quotes' }}
      />
    </div>
  )
}
