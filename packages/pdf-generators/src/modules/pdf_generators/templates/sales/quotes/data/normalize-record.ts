import type { QuoteWidgetRecord } from './types'
import { formatDate } from '../../../../utils/formatDate'

export function normalizeRecord(record: unknown): Record<string, unknown> {
  const r = record as QuoteWidgetRecord
  const customer = r.customerSnapshot?.customer
  const contact = r.customerSnapshot?.contact
  const billing = r.billingAddressSnapshot

  const addressParts = [
    billing?.addressLine1,
    billing?.addressLine2,
    [billing?.postalCode, billing?.city].filter(Boolean).join(' '),
    billing?.region,
    billing?.country,
  ].filter(Boolean)

  return {
    document: {
      number: r.quoteNumber,
      date: r.validFrom ? formatDate(r.validFrom) : '',
      validUntil: r.validUntil ? formatDate(r.validUntil) : undefined,
    },
    client: {
      name: contact ? `${contact.firstName} ${contact.lastName}` : (customer?.displayName ?? ''),
      email: contact?.email ?? customer?.primaryEmail ?? undefined,
      company: customer?.companyProfile?.legalName ?? customer?.displayName ?? undefined,
      address: addressParts.length > 0 ? addressParts.join(', ') : undefined,
    },
    seller: {
      name: '',
      company: '',
      email: '',
    },
    lines: [],
    totals: {
      subtotal: r.grandTotalNetAmount ?? 0,
      tax: r.taxTotalAmount ?? 0,
      total: r.grandTotalGrossAmount ?? 0,
      currency: r.currencyCode,
    },
    notes: r.comment ?? undefined,
  }
}
