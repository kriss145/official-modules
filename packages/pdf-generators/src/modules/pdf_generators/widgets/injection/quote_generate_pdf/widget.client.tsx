'use client'

import * as React from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@open-mercato/ui/primitives/button'
import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { PdfGeneratorDrawer } from '../../../components/PdfGeneratorDrawer'
import type { QuoteWidgetContext } from './types'
import { toDocumentData } from './document-data'

export default function QuoteGeneratePdfWidget({ context }: InjectionWidgetComponentProps) {
  const t = useT()
  const [open, setOpen] = React.useState(false)

  const ctx = context as QuoteWidgetContext
  const record = ctx?.record

  if (!record) return null

  const data = toDocumentData(record)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        {t('pdf_generators.generate.button', 'Generuj PDF')}
      </Button>

      <PdfGeneratorDrawer
        open={open}
        onClose={() => setOpen(false)}
        data={data}
        templateIds={['codee-offer']}
      />
    </>
  )
}
