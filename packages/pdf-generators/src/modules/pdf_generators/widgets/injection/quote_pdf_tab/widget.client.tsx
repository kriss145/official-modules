'use client'

import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { TemplatesList } from '../../../components/TemplatesList'
import type { QuoteWidgetContext } from '../../../data/quote-detail/types'

// Side effect: registers internal templates in the client-side globalThis registry
import '../../../config/registry'

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
