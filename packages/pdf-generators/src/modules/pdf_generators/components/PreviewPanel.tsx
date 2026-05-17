'use client'

import * as React from 'react'
import { Download } from 'lucide-react'
import { Button } from '@open-mercato/ui/primitives/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@open-mercato/ui/primitives/dialog'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import type { TemplateMeta } from '../lib/interfaces'
import { Preview } from './Preview'
import { Loader } from './Loader'
import { downloadBlob } from '../utils/downloadBlob'

interface PreviewPanelProps {
  open: boolean
  onClose: () => void
  record: unknown
  template: TemplateMeta
}

export function PreviewPanel({ open, onClose, record, template }: PreviewPanelProps) {
  const t = useT()
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!open) return

    setLoading(true)
    setBlobUrl(null)

    let objectUrl: string
    let cancelled = false

    const run = async () => {
      const { result } = await apiCall('/api/pdf-generators/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: template.id, data: record }),
      }, {
        parse: (res) => res.blob(),
      })

      if (cancelled) return
      if (result) {
        objectUrl = URL.createObjectURL(result)
        setBlobUrl(objectUrl)
      }
    }

    run().catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [open, template.id])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex h-screen w-screen max-w-none sm:h-screen sm:max-w-none sm:rounded-none flex-col gap-0 p-0 translate-x-0 translate-y-0 sm:translate-x-0 sm:translate-y-0 sm:inset-0 sm:top-0 sm:left-0">
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>{t('pdf_generators.preview.title', 'Podgląd dokumentu')}</DialogTitle>
          <DialogDescription>{template.label}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden bg-muted/30">
            {loading && (
              <div className="flex h-full items-center justify-center">
                <Loader />
              </div>
            )}
            {blobUrl && <Preview url={blobUrl} />}
          </div>
          <div className="border-t bg-background px-6 py-4">
            <Button onClick={() => blobUrl && downloadBlob(blobUrl, template.id)} disabled={!blobUrl} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {t('pdf_generators.generate.button', 'Pobierz PDF')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
