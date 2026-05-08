'use client'

import * as React from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@open-mercato/ui/primitives/button'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { PdfGeneratorDrawer } from './PdfGeneratorDrawer'

interface QuotePdfGeneratorButtonProps {
  data: Record<string, unknown>
  templateIds?: string[]
}

export function QuotePdfGeneratorButton({ data, templateIds }: QuotePdfGeneratorButtonProps) {
  const t = useT()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        {t('pdf_generators.generate.open', 'Generuj PDF')}
      </Button>

      <PdfGeneratorDrawer
        open={open}
        onClose={() => setOpen(false)}
        data={data}
        templateIds={templateIds}
      />
    </>
  )
}
