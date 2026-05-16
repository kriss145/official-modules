import { BaseDocumentService } from './base-document-service'
import { formatDate } from '../utils/formatDate'

/** Template IDs registered by this service — exported for TemplateId type derivation. */
export const ORDERS_TEMPLATE_IDS = ['order-invoice'] as const

/**
 * Raw order record passed from the widget context — shape mirrors the API response snapshot fields.
 */
export interface OrderWidgetRecord {
  id: string
  orderNumber: string
  currencyCode: string
  placedAt: string | null
  expectedDeliveryAt: string | null
  comment: string | null
  subtotalNetAmount: number | null
  subtotalGrossAmount: number | null
  taxTotalAmount: number | null
  grandTotalNetAmount: number | null
  grandTotalGrossAmount: number | null
  shippingNetAmount: number | null
  shippingGrossAmount: number | null
  /** Populated server-side by enrichRecord — not present in the raw widget context. */
  lineItems?: OrderLineItem[]
  customerSnapshot: {
    customer: {
      displayName: string
      primaryEmail: string | null
      companyProfile: { legalName: string } | null
    }
    contact: {
      firstName: string
      lastName: string
      email: string | null
    } | null
  } | null
  billingAddressSnapshot: {
    companyName: string | null
    addressLine1: string | null
    addressLine2: string | null
    city: string | null
    region: string | null
    postalCode: string | number | null
    country: string | null
  } | null
}

export interface OrderLineItem {
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
 * Document service for the Orders module.
 *
 * Owns all PDF templates related to orders and defines how raw OrderWidgetRecord
 * data is normalized into the flat shape expected by those templates.
 */
export class OrdersDocumentService extends BaseDocumentService {
  readonly id = 'orders'
  readonly label = 'Orders'
  readonly moduleId = 'sales'

  constructor() {
    super()

    this.registerTemplate({
      id: 'order-invoice',
      label: 'Order Invoice',
      description: 'Standard invoice for a sales order.',
      category: 'invoice',
      tags: ['invoice', 'order', 'sales'],
      load: () =>
        import('../templates/sales/orders/templates/order-invoice').then(
          (m) => m.OrderInvoiceDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>
        ),
    })
  }

  /**
   * Fetches order line items directly from the database via the request-scoped EntityManager.
   * Attaches them as `lineItems` on the record before normalizeRecord runs.
   *
   * @param record - Raw OrderWidgetRecord from the widget context
   * @param em - MikroORM EntityManager from createRequestContainer()
   */
  override async enrichRecord(record: unknown, em: unknown): Promise<unknown> {
    const r = record as OrderWidgetRecord
    if (!r?.id) return record

    try {
      const conn = (em as any).getConnection() as { execute: (sql: string, params?: unknown[]) => Promise<unknown[]> }
      const rows = await conn.execute(
        `SELECT id, name, description, quantity, unit_price_net, unit_price_gross,
                total_net_amount, total_gross_amount, tax_rate, currency_code
         FROM sales_order_lines
         WHERE order_id = ?
         ORDER BY line_number ASC`,
        [r.id]
      )

      const lineItems: OrderLineItem[] = (rows ?? []).map((row: any) => ({
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
      console.error('[OrdersDocumentService] enrichRecord failed, falling back to empty lines', err)
      return record
    }
  }

  /**
   * Maps a raw OrderWidgetRecord (enriched with lineItems) into the flat data shape expected by order PDF templates.
   *
   * @param record - Raw record from the widget context, enriched with lineItems by enrichRecord
   * @returns Normalized data object passed to the template component
   */
  normalizeRecord(record: unknown): Record<string, unknown> {
    const r = record as OrderWidgetRecord
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
        number: r.orderNumber,
        date: r.placedAt ? formatDate(r.placedAt) : formatDate(new Date().toISOString()),
        dueDate: r.expectedDeliveryAt ? formatDate(r.expectedDeliveryAt) : undefined,
      },
      client: {
        // contact takes priority over customer displayName for individual recipients
        name: contact ? `${contact.firstName} ${contact.lastName}` : (customer?.displayName ?? ''),
        company: customer?.companyProfile?.legalName ?? customer?.displayName ?? undefined,
        email: contact?.email ?? customer?.primaryEmail ?? undefined,
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
