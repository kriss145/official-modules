'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import type { TemplateMeta, TemplateFilter } from '../lib/interfaces'
import { getAllTemplates } from '../lib/template-registry'
import { PreviewPanel } from './PreviewPanel'
import { TemplatesListView } from './TemplatesListView'
import { TemplatesListLoader } from './TemplatesListLoader'

interface TemplatesListProps {
  record: unknown
  filter?: TemplateFilter
}

function applyFilter(templates: TemplateMeta[], filter?: TemplateFilter): TemplateMeta[] {
  if (!filter) return templates
  return templates.filter((t) => {
    if (filter.category && t.category !== filter.category) return false
    if (filter.moduleId && t.moduleId !== filter.moduleId) return false
    if (filter.tags && filter.tags.length > 0 && !filter.tags.some((tag) => t.tags.includes(tag))) return false
    return true
  })
}

export function TemplatesList({ record, filter }: TemplatesListProps) {
  const t = useT()
  const [templates, setTemplates] = React.useState<TemplateMeta[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selected, setSelected] = React.useState<{ meta: TemplateMeta; data: Record<string, unknown> } | null>(null)

  React.useEffect(() => {
    apiCall<{ internal: TemplateMeta[]; external: TemplateMeta[] }>('/api/pdf-generators/templates')
      .then(({ result }) => {
        const all: TemplateMeta[] = [
          ...(Array.isArray(result?.internal) ? result.internal : []),
          ...(Array.isArray(result?.external) ? result.external : []),
        ]
        setTemplates(applyFilter(all, filter))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleSelect(meta: TemplateMeta) {
    const entry = getAllTemplates().find((e) => e.id === meta.id)
    const data = entry ? entry.fromRecord(record) : {}
    setSelected({ meta, data })
  }

  if (loading) return <TemplatesListLoader />

  return (
    <>
      <h2 className="mb-4 text-sm font-semibold">{t('pdf_generators.templates.title', 'Dostępne szablony PDF')}</h2>
      <TemplatesListView templates={templates} onSelect={handleSelect} />

      {selected && (
        <PreviewPanel
          open={true}
          onClose={() => setSelected(null)}
          data={selected.data}
          template={selected.meta}
        />
      )}
    </>
  )
}
