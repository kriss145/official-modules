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
import { useT } from '@open-mercato/shared/lib/i18n/context'
import type { TemplateMeta } from '../lib/interfaces'
import { Preview } from './Preview'

interface PreviewPanelProps {
  open: boolean
  onClose: () => void
  data: Record<string, unknown>
  template: TemplateMeta
}

export function PreviewPanel({ open, onClose, data, template }: PreviewPanelProps) {
  const t = useT()

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex h-screen w-screen max-w-none sm:h-screen sm:max-w-none sm:rounded-none flex-col gap-0 p-0 translate-x-0 translate-y-0 sm:translate-x-0 sm:translate-y-0 sm:inset-0 sm:top-0 sm:left-0">
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>{t('pdf_generators.preview.title', 'Podgląd dokumentu')}</DialogTitle>
          <DialogDescription>{template.label}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden bg-muted/30">
            <Preview templateId={template.id} data={data} />
          </div>
          <div className="border-t bg-background px-6 py-4">
            <DownloadButton templateId={template.id} data={data} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DownloadButton({ templateId, data }: { templateId: string; data: Record<string, unknown> }) {
  const t = useT()
  const [loading, setLoading] = React.useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch('/api/pdf-generators/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, data }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${templateId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} className="w-full">
      <Download className="mr-2 h-4 w-4" />
      {loading
        ? t('pdf_generators.generate.generating', 'Generowanie...')
        : t('pdf_generators.generate.button', 'Pobierz PDF')}
    </Button>
  )
}
