import type { QuoteWidgetRecord } from './types'
import { formatDate } from '../../../../utils/formatDate'

/**
 * Maps a raw QuoteWidgetRecord from the server into the flat data shape expected by PDF templates.
 *
 * @param record - Raw record from the widget context
 * @returns Normalized data object passed to the template component
 */
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
      // contact takes priority over customer displayName for individual recipients
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
