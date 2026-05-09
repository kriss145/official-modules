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
}

/**
 * Full widget context passed to the quote PDF widget — wraps the record with routing metadata.
 */
export interface QuoteWidgetContext {
  kind: string
  resourceId: string
  resourceKind: string
  record: QuoteWidgetRecord
}
