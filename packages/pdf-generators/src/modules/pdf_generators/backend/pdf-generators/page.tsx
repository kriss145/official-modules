'use client'

import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import React from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import type { TemplateMeta } from '../../lib/interfaces'

type TemplatesResponse = { internal: TemplateMeta[]; external: TemplateMeta[] }

const columns: ColumnDef<TemplateMeta>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    meta: { maxWidth: 220, truncate: true },
  },
  {
    accessorKey: 'label',
    header: 'Label',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    meta: { truncate: true },
  },
]

export default function PdfGeneratorsPage() {
  const t = useT()
  const [internal, setInternal] = React.useState<TemplateMeta[]>([])
  const [external, setExternal] = React.useState<TemplateMeta[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    apiCall<TemplatesResponse>('/api/pdf-generators/templates', { method: 'GET' })
      .then(({ result }) => {
        setInternal(result?.internal ?? [])
        setExternal(result?.external ?? [])
      })
      .catch(() => setError(t('pdf_generators.page.error', 'Failed to load templates.')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Page>
      <PageHeader
        title={t('pdf_generators.page.title', 'PDF Generators')}
        description={t('pdf_generators.page.description', 'Registered PDF templates available in this application.')}
      />
      <PageBody>
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('pdf_generators.page.internal', 'Internal templates')}
            </h2>
            <DataTable
              columns={columns}
              data={internal}
              isLoading={loading}
              error={error}
              disableRowClick
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {t('pdf_generators.page.external', 'External templates')}
            </h2>
            <DataTable
              columns={columns}
              data={external}
              isLoading={loading}
              error={error}
              disableRowClick
            />
          </section>
        </div>
      </PageBody>
    </Page>
  )
}
