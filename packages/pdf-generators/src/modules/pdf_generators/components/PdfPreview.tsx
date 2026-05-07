'use client'

import React from 'react'

interface PdfPreviewProps {
  templateId: string
  data: Record<string, unknown>
}

export function PdfPreview({ templateId, data }: PdfPreviewProps) {
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    let objectUrl: string

    fetch('/api/pdf-generators/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId, data }),
    })
      .then((r) => r.blob())
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {})

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [templateId, data])

  if (!url) return null

  return <object data={url} type="application/pdf" width="100%" height="100%" />
}
