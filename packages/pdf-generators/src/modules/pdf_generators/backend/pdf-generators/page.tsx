'use client'

import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function PdfGeneratorsPage() {
  const t = useT()

  return (
    <Page>
      <PageHeader
        title={t('pdf_generators.page.title', 'PDF Generators')}
        description={t('pdf_generators.page.description', 'Generates PDF sales documents.')}
      />
      <PageBody>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-base font-semibold">
            {t('pdf_generators.page.cardTitle', 'Module is wired correctly')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              'pdf_generators.page.cardDescription',
              'If this page renders, the package build, module discovery, and backend routing are working.',
            )}
          </p>
        </div>
      </PageBody>
    </Page>
  )
}
