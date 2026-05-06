'use client'

import * as React from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@open-mercato/ui/primitives/button'
import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { PdfGeneratorDrawer } from '../../PdfGeneratorDrawer'
import type { PdfDocumentData } from '../../../lib/types'

type WidgetContext = {
  resourceId?: string
  record?: Record<string, unknown>
}

export default function QuoteGeneratePdfWidget({ context }: InjectionWidgetComponentProps) {
  const t = useT()
  const [open, setOpen] = React.useState(false)
  const [data, setData] = React.useState<PdfDocumentData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const ctx = context as WidgetContext
  const quoteId = typeof ctx?.resourceId === 'string' ? ctx.resourceId : null

  async function handleOpen() {
    if (!quoteId) return
    setLoading(true)
    setError(null)

    const res = await apiCall<{ data: PdfDocumentData }>(
      `/api/pdf-generators/quote-data/${quoteId}`,
    )

    if (!res.ok || !res.result?.data) {
      setError(t('pdf_generators.error.loadQuote', 'Nie udało się wczytać danych oferty.'))
      setLoading(false)
      return
    }

    setData(res.result.data)
    setLoading(false)
    setOpen(true)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={loading || !quoteId}
      >
        <FileText className="mr-2 h-4 w-4" />
        {loading
          ? t('pdf_generators.generate.loading', 'Ładowanie...')
          : t('pdf_generators.generate.button', 'Generuj PDF')}
      </Button>

      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}

      {data && (
        <PdfGeneratorDrawer
          open={open}
          onClose={() => setOpen(false)}
          data={data}
        />
      )}
    </>
  )
}
