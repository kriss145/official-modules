import { BaseDocumentService } from '@open-mercato/pdf-generators'

/**
 * Raw order record passed from the sales order widget context (`context.record`).
 * Adjust fields to match what your specific widget slot provides.
 */
interface OrderWidgetRecord {
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

/**
 * Document service for the Example module — demonstrates external template registration.
 *
 * Naming convention: `{ModuleId}{Category}DocumentService`
 * - `readonly id`       must be globally unique: `{module-id}-{category}s`
 * - `readonly moduleId` used by <TemplatesList filter={{ moduleId }}> to scope the widget
 *
 * To add more templates call this.registerTemplate() again in the constructor.
 */
export class ExampleInvoicesDocumentService extends BaseDocumentService {
  readonly id = 'example-invoices'
  readonly label = 'Example Invoices'
  readonly moduleId = 'example'

  constructor() {
    super()

    this.registerTemplate({
      id: 'example-invoice',
      label: 'Example Invoice',
      description: 'Simple invoice template for demonstration purposes.',
      category: 'invoice',
      tags: ['invoice', 'example'],
      // load must be a lazy import — templates are never bundled eagerly
      load: () =>
        import('./templates/example-invoice').then(
          (m) => m.ExampleInvoiceDocument as unknown as React.ComponentType<{ data: Record<string, unknown> }>
        ),
    })
  }

  /**
   * Maps a raw OrderWidgetRecord into the flat data shape expected by invoice templates.
   * Called automatically by BaseDocumentService before rendering the template.
   *
   * @param record - Raw `context.record` value from the injection widget
   * @returns Normalized object matching ExampleInvoiceData
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

    return {
      document: {
        number: r.orderNumber,
        date: r.placedAt ? this.formatDate(r.placedAt) : this.formatDate(new Date().toISOString()),
        dueDate: r.expectedDeliveryAt ? this.formatDate(r.expectedDeliveryAt) : undefined,
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
      // TODO: fetch line items from API — order record contains lineItemCount but not the items themselves
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
}
