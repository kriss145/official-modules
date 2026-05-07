'use client'

import React from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import { loadTemplate } from '../lib/templates'
import type { PdfTemplateDefinition } from '../lib/templates'

interface PdfPreviewProps {
  templateId: string
  data: Record<string, unknown>
}

export function PdfPreview({ templateId, data }: PdfPreviewProps) {
  const [template, setTemplate] = React.useState<PdfTemplateDefinition | null>(null)

  React.useEffect(() => {
    loadTemplate(templateId).then(setTemplate)
  }, [templateId])

  if (!template) return null

  return (
    <PDFViewer width="100%" height="100%" showToolbar={false}>
      <template.component data={data} />
    </PDFViewer>
  )
}
