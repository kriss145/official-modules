'use client'

import type { PdfDocumentData } from '../lib/types'
import { MyDocument } from './MyDocument'

interface PdfPreviewProps {
  data: PdfDocumentData
}

export function PdfPreview({ data }: PdfPreviewProps) {
  return (
    <MyDocument />
  )
}
