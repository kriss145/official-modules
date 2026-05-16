'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import type { TemplateMeta, TemplateFilter } from '../lib/interfaces'
import { PreviewPanel } from './PreviewPanel'
import { TemplatesListView } from './TemplatesListView'
import { TemplatesListLoader } from './TemplatesListLoader'

interface TemplatesListProps {
  record: unknown
  filter?: TemplateFilter
  /** Optional async function called before POST /generate — use to attach related data not present in the widget context (e.g. line items). */
  enrichRecord?: (record: unknown) => Promise<unknown>
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

export function TemplatesList({ record, filter, enrichRecord }: TemplatesListProps) {
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
        setTemplates(applyFilter(all, filter))
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
          record={record}
          template={selected}
          enrichRecord={enrichRecord}
        />
      )}
    </>
  )
}
