/**
 * Data shape expected by the ExampleInvoice PDF template.
 *
 * This interface is the contract between normalizeRecord() in the DocumentService
 * and the React-PDF component. Keep it flat and serializable — no class instances.
 */
export interface ExampleInvoiceData {
  document: {
    number: string
    date: string
    dueDate?: string
  }
  seller: {
    name: string
    company: string
    email: string
    /** Single letter displayed in the avatar circle on the template header. */
    logoInitial?: string
  }
  client: {
    name: string
    company?: string
    email?: string
    address?: string
  }
  lines: Array<{
    title: string
    description?: string
    quantity: number
    unitPrice: number
    total: number
    currency: string
  }>
  totals: {
    subtotal: number
    tax: number
    total: number
    currency: string
  }
  notes?: string
  paymentDetails?: {
    bankName?: string
    routingNumber?: string
    accountNumber?: string
    swiftCode?: string
  }
}
