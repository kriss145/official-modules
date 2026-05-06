import React from 'react'
import { Document } from '@react-pdf/renderer'
import './theme'
import { CoverPage } from './CoverPage'
import { QuotePage } from './QuotePage'
import type { PdfDocumentData } from '../../lib/types'

export function CodeeOfferDocument({ data }: { data: PdfDocumentData }) {
  return (
    <Document>
      <CoverPage data={data} />
      <QuotePage data={data} />
    </Document>
  )
}
