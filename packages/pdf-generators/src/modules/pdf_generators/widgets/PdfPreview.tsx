'use client'

import { MyDocument } from './MyDocument'

interface PdfPreviewProps {
  data: Record<string, unknown>
}

export function PdfPreview({ data }: PdfPreviewProps) {
  return (
    <MyDocument />
  )
}
