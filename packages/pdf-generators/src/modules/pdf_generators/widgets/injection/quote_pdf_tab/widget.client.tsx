'use client'

import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { TemplatesList } from '../../../components/TemplatesList'
import type { QuoteWidgetRecord, QuoteLineItem } from '../../../services'

interface QuoteWidgetContext {
  kind: string
  resourceId: string
  resourceKind: string
  record: QuoteWidgetRecord
}

async function enrichQuoteRecord(record: unknown): Promise<unknown> {
  const r = record as QuoteWidgetRecord
  if (!r?.id) return record

  const response = await apiCall<{ items?: Array<Record<string, unknown>> }>(
    `/api/sales/quote-lines?quoteId=${r.id}&page=1&pageSize=100`,
    undefined,
    { fallback: { items: [] } }
  )

  const lineItems: QuoteLineItem[] = (response.result?.items ?? []).flatMap((item) => {
    const id = typeof item.id === 'string' ? item.id : null
    if (!id) return []
    return [{
      id,
      name: typeof item.name === 'string' ? item.name : null,
      description: typeof item.description === 'string' ? item.description : null,
      quantity: String(item.quantity ?? '0'),
      unitPriceNet: String(item.unit_price_net ?? item.unitPriceNet ?? '0'),
      unitPriceGross: String(item.unit_price_gross ?? item.unitPriceGross ?? '0'),
      totalNetAmount: String(item.total_net_amount ?? item.totalNetAmount ?? '0'),
      totalGrossAmount: String(item.total_gross_amount ?? item.totalGrossAmount ?? '0'),
      taxRate: String(item.tax_rate ?? item.taxRate ?? '0'),
      currencyCode: String(item.currency_code ?? item.currencyCode ?? r.currencyCode),
    }]
  })

  return { ...r, lineItems }
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
        enrichRecord={enrichQuoteRecord}
      />
    </div>
  )
}
