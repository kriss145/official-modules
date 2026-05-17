import { BaseDocumentService } from './base-document-service'
import { formatDate } from '../utils/formatDate'

/** Template IDs registered by this service — exported for TemplateId type derivation. */
export const QUOTES_TEMPLATE_IDS = ['sales-offer'] as const

/**
 * Raw quote record passed from the widget context — shape mirrors the API response snapshot fields.
 */
export interface QuoteWidgetRecord {
  id: string
  quoteNumber: string
  status: string
  currencyCode: string
  validFrom: string | null
  validUntil: string | null
  comment: string | null
  subtotalNetAmount: number | null
  subtotalGrossAmount: number | null
  taxTotalAmount: number | null
  grandTotalNetAmount: number | null
  grandTotalGrossAmount: number | null
  discountTotalAmount: number | null
  shippingNetAmount: number | null
  shippingGrossAmount: number | null
  customerSnapshot: {
    customer: {
      id: string
      kind: string
      displayName: string
      primaryEmail: string | null
      primaryPhone: string | null
      companyProfile: {
        legalName: string
        brandName: string | null
        domain: string | null
        websiteUrl: string | null
      } | null
    }
    contact: {
      id: string
      firstName: string
      lastName: string
      email: string | null
      phone: string | null
    } | null
  } | null
  billingAddressSnapshot: {
    companyName: string | null
    name: string | null
    addressLine1: string | null
    addressLine2: string | null
    city: string | null
    region: string | null
    postalCode: string | number | null // API returns string or number depending on country
    country: string | null
  } | null
  /** Populated server-side by fetchData — not present in the raw widget context. */
  lineItems?: QuoteLineItem[]
}

export interface QuoteLineItem {
  id: string
  name: string | null
  description: string | null
  quantity: string
  unitPriceNet: string
  unitPriceGross: string
  totalNetAmount: string
  totalGrossAmount: string
  taxRate: string
  currencyCode: string
}

/**
 * Document service for the Quotes module.
 *
 * Owns all PDF templates related to quotes and defines how raw QuoteWidgetRecord
 * data is normalized into the flat shape expected by those templates.
 */
export class QuotesDocumentService extends BaseDocumentService {
  readonly id = 'quotes'
  readonly label = 'Quotes'
  readonly moduleId = 'quotes'

  constructor() {
    super()

    this.registerTemplate({
      id: 'sales-offer',
      label: 'Sales Offer',
      description: 'Professional sales offer.',
      category: 'quote',
      tags: ['offer', 'sales'],
      load: () =>
        import('../templates/sales/quotes/templates/sales-offer').then(
          (m) => m.SalesOfferDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>
        ),
    })
  }

  /**
   * Fetches quote line items directly from the database via the request-scoped EntityManager.
   * Attaches them as `lineItems` on the record before normalizeRecord runs.
   *
   * @param record - Raw QuoteWidgetRecord from the widget context
   * @param em - MikroORM EntityManager from createRequestContainer()
   */
  override async fetchData(record: unknown, em: unknown): Promise<unknown> {
    const r = record as QuoteWidgetRecord
    if (!r?.id) return record

    try {
      const conn = (em as any).getConnection() as { execute: (sql: string, params?: unknown[]) => Promise<unknown[]> }
      const rows = await conn.execute(
        `SELECT id, name, description, quantity, unit_price_net, unit_price_gross,
                total_net_amount, total_gross_amount, tax_rate, currency_code
         FROM sales_quote_lines
         WHERE quote_id = ?
         ORDER BY line_number ASC`,
        [r.id]
      )

      const lineItems: QuoteLineItem[] = (rows ?? []).map((row: any) => ({
        id: row.id,
        name: row.name ?? null,
        description: row.description ?? null,
        quantity: row.quantity ?? '0',
        unitPriceNet: row.unit_price_net ?? '0',
        unitPriceGross: row.unit_price_gross ?? '0',
        totalNetAmount: row.total_net_amount ?? '0',
        totalGrossAmount: row.total_gross_amount ?? '0',
        taxRate: row.tax_rate ?? '0',
        currencyCode: row.currency_code,
      }))

      return { ...r, lineItems }
    } catch (err) {
      console.error('[QuotesDocumentService] fetchData failed, falling back to empty lines', err)
      return record
    }
  }

  /**
   * Maps a raw QuoteWidgetRecord (enriched with lineItems) into the flat data shape expected by quote PDF templates.
   *
   * @param record - Raw record from the widget context, enriched with lineItems by fetchData
   * @returns Normalized data object passed to the template component
   */
  normalizeRecord(record: unknown): Record<string, unknown> {
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

    const lines = (r.lineItems ?? []).map((line) => ({
      title: line.name ?? '',
      description: line.description ?? undefined,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPriceNet),
      total: Number(line.totalNetAmount),
      currency: line.currencyCode,
    }))

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
      lines,
      totals: {
        subtotal: r.grandTotalNetAmount ?? 0,
        tax: r.taxTotalAmount ?? 0,
        total: r.grandTotalGrossAmount ?? 0,
        currency: r.currencyCode,
      },
      notes: r.comment ?? undefined,
    }
  }
}
