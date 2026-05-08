'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import type { TemplateMeta } from '../lib/interfaces'
import { PreviewPanel } from './PreviewPanel'
import { TemplatesListView } from './TemplatesListView'
import { TemplatesListLoader } from './TemplatesListLoader'

interface TemplatesListProps {
  data: Record<string, unknown>
  templateIds?: string[]
}

export function TemplatesList({ data, templateIds }: TemplatesListProps) {
  const t = useT()
  const [templates, setTemplates] = React.useState<TemplateMeta[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<TemplateMeta | null>(null)

  React.useEffect(() => {
    apiCall<{ internal: TemplateMeta[]; external: TemplateMeta[] }>('/api/pdf-generators/templates')
      .then(({ result }) => {
        const all: TemplateMeta[] = [
          ...(Array.isArray(result?.internal) ? result.internal : []),
          ...(Array.isArray(result?.external) ? result.external : []),
        ]
        setTemplates(templateIds ? all.filter((t) => templateIds.includes(t.id)) : all)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TemplatesListLoader />

  return (
    <>
      <h2 className="mb-4 text-sm font-semibold">{t('pdf_generators.templates.title', 'Dostępne szablony PDF')}</h2>
      <TemplatesListView templates={templates} onSelect={setSelected} />

      {selected && (
        <PreviewPanel
          open={true}
          onClose={() => setSelected(null)}
          data={data}
          template={selected}
        />
      )}
    </>
  )
}
