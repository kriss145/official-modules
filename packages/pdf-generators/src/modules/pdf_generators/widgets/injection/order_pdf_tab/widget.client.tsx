'use client'

import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { TemplatesList } from '../../../components/TemplatesList'
import type { OrderWidgetRecord } from '../../../services'

/**
 * Full widget context passed to the order PDF widget — wraps the record with routing metadata.
 */
interface OrderWidgetContext {
  kind: string
  resourceId: string
  resourceKind: string
  record: OrderWidgetRecord
}

export default function OrderPdfTabWidget({ context }: InjectionWidgetComponentProps) {
  const ctx = context as OrderWidgetContext
  const record = ctx?.record

  if (!record) return null

  return (
    <div className="border rounded-lg p-4">
      <TemplatesList
        record={record}
        filter={{ category: 'invoice', moduleId: 'sales' }}
      />
    </div>
  )
}
