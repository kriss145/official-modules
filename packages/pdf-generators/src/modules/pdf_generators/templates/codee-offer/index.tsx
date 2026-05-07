import { Document } from '@react-pdf/renderer'
import './theme'
import { CoverPage } from './CoverPage'
import { QuotePage } from './QuotePage'
import type { PdfDocumentData } from './types'

export function CodeeOfferDocument({ data }: { data: PdfDocumentData }) {
  return (
    <Document style={{ fontFamily: 'Inter' }}>
      <CoverPage data={data} />
      <QuotePage data={data} />
    </Document>
  )
}
