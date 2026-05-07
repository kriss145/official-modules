'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { FileText, ChevronLeft, Download } from 'lucide-react'
import { Button } from '@open-mercato/ui/primitives/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@open-mercato/ui/primitives/dialog'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { getTemplateMetas, loadTemplate } from '../lib/templates'
import type { TemplateMeta } from '../lib/templates'
import type { PdfDocumentData } from '../lib/types'
import { PdfPreview } from './PdfPreview'
import { PDFDownloadLink } from '@react-pdf/renderer';

type Step = 'select' | 'preview'

interface PdfGeneratorDrawerProps {
  open: boolean
  onClose: () => void
  data: PdfDocumentData
}

export function PdfGeneratorDrawer({ open, onClose, data }: PdfGeneratorDrawerProps) {
  const t = useT()
  const templates = getTemplateMetas()
  const [step, setStep] = React.useState<Step>('select')
  const [selected, setSelected] = React.useState<TemplateMeta | null>(null)

  function handleSelectTemplate(template: TemplateMeta) {
    setSelected(template)
    setStep('preview')
  }

  function handleBack() {
    setStep('select')
    setSelected(null)
  }

  function handleClose() {
    setStep('select')
    setSelected(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="-ml-1">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle>
                {step === 'select'
                  ? t('pdf_generators.template.select', 'Wybierz szablon')
                  : t('pdf_generators.preview.title', 'Podgląd dokumentu')}
              </DialogTitle>
              {step === 'preview' && selected && (
                <DialogDescription>{selected.label}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {step === 'select' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="flex items-start gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="mt-0.5 rounded-md bg-muted p-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{template.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'preview' && selected && (
            <>
              <div className="flex-1 overflow-hidden bg-muted/30">
                <PdfPreview data={data} />
              </div>
              <div className="border-t bg-background px-6 py-4">
                {/* <PDFDownloadLink document={<PdfPreview data={data} />} fileName={`${data.document.number}.pdf`}> */}
                <DownloadButton templateId={selected.id} data={data} />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DownloadButton({ templateId, data }: { templateId: string; data: PdfDocumentData }) {
  const t = useT()
  const [loading, setLoading] = React.useState(false)

  async function handleDownload() {
    setLoading(true)

    try {
      const res = await fetch('/api/pdf-generators/generate', { method: 'POST' })
      if (!res.ok) throw new Error('Generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.document.number}-${templateId}.pdf`
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
