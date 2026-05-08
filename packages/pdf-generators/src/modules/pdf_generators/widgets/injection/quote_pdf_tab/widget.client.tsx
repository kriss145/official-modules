'use client'

import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { TemplatesList } from '../../../components/TemplatesList'
import type { QuoteWidgetContext } from '../../../data/quote-detail'
import { toDocumentData } from '../../../data/quote-detail'

export default function QuotePdfTabWidget({ context }: InjectionWidgetComponentProps) {
  const ctx = context as QuoteWidgetContext
  const record = ctx?.record

  if (!record) return null

  return (
    <div className="border rounded-lg p-4">
      <TemplatesList
        data={toDocumentData(record)}
        templateIds={['sales-offer', 'example-invoice']}
      />
    </div>
  )
}
