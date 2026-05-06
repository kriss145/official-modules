import type { PdfDocumentData } from './types'

type QuoteApiRecord = Record<string, unknown>
type QuoteLine = Record<string, unknown>

function str(v: unknown): string {
  return v != null ? String(v) : ''
}

function num(v: unknown): number {
  const n = parseFloat(String(v ?? '0'))
  return isNaN(n) ? 0 : n
}

function formatDate(v: unknown): string {
  if (!v) return ''
  try {
    return new Date(String(v)).toLocaleDateString('pl-PL')
  } catch {
    return str(v)
  }
}

function resolveClientName(snapshot: unknown, fallback: string): string {
  if (snapshot && typeof snapshot === 'object') {
    const s = snapshot as Record<string, unknown>
    return str(s.name ?? s.companyName ?? s.fullName ?? fallback)
  }
  return fallback
}

export function mapQuoteToDocumentData(quote: QuoteApiRecord, sellerName: string, sellerCompany: string, sellerEmail: string): PdfDocumentData {
  const lines = (Array.isArray(quote.lines) ? quote.lines : []) as QuoteLine[]
  const currency = str(quote.currencyCode || 'PLN')

  const subtotal = num(quote.subtotalNetAmount)
  const gross = num(quote.subtotalGrossAmount)
  const tax = parseFloat((gross - subtotal).toFixed(4))

  const customerSnapshot = quote.customerSnapshot as Record<string, unknown> | null | undefined
  const clientName = resolveClientName(customerSnapshot, 'Klient')
  const clientEmail = str(customerSnapshot?.email ?? customerSnapshot?.contactEmail ?? '')
  const clientCompany = str(customerSnapshot?.companyName ?? customerSnapshot?.name ?? '')

  return {
    document: {
      number: str(quote.quoteNumber),
      date: formatDate(quote.placedAt ?? quote.createdAt),
      validUntil: quote.validUntil ? formatDate(quote.validUntil) : undefined,
    },
    client: {
      name: clientName,
      email: clientEmail || undefined,
      company: clientCompany || undefined,
    },
    seller: {
      name: sellerName,
      company: sellerCompany,
      email: sellerEmail,
    },
    lines: lines.map((line) => ({
      title: str(line.name ?? line.productName),
      description: str(line.description ?? '') || undefined,
      quantity: num(line.quantity),
      unitPrice: num(line.unitPriceNet),
      total: num(line.totalNetAmount),
      currency,
    })),
    totals: {
      subtotal,
      tax,
      total: gross,
      currency,
    },
    notes: quote.comments ? str(quote.comments) : undefined,
  }
}
