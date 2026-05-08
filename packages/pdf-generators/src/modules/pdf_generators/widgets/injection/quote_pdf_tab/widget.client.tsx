'use client'

import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { QuotePdfGeneratorButton } from '../../../components/QuotePdfGeneratorButton'
import type { QuoteWidgetContext } from '../../../data/quote-detail'
import { toDocumentData } from '../../../data/quote-detail'

export default function QuotePdfTabWidget({ context }: InjectionWidgetComponentProps) {
  const ctx = context as QuoteWidgetContext
  const record = ctx?.record

  if (!record) return null

  return (
    <div className="p-0">
      <QuotePdfGeneratorButton
        data={toDocumentData(record)}
        templateIds={['sales-offer', 'example-invoice']}
      />
    </div>
  )
}
