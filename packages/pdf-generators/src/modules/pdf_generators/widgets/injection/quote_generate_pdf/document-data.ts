import type { PdfDocumentData } from '../../../templates/codee-offer/types'
import type { QuoteWidgetRecord } from './types'

export function toDocumentData(record: QuoteWidgetRecord): PdfDocumentData {
  const customer = record.customerSnapshot?.customer
  const contact = record.customerSnapshot?.contact
  const billing = record.billingAddressSnapshot

  const addressParts = [
    billing?.addressLine1,
    billing?.addressLine2,
    [billing?.postalCode, billing?.city].filter(Boolean).join(' '),
    billing?.region,
    billing?.country,
  ].filter(Boolean)

  return {
    document: {
      number: record.quoteNumber,
      date: record.validFrom ? formatDate(record.validFrom) : '',
      validUntil: record.validUntil ? formatDate(record.validUntil) : undefined,
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
      subtotal: record.grandTotalNetAmount ?? 0,
      tax: record.taxTotalAmount ?? 0,
      total: record.grandTotalGrossAmount ?? 0,
      currency: record.currencyCode,
    },
    notes: record.comment ?? undefined,
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
