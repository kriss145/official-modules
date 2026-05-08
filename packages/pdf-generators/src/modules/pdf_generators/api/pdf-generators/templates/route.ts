import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { NextResponse } from 'next/server'
import { getInternalTemplates, getExternalTemplates } from '../../../lib/template-registry'
import type { TemplateMeta } from '../../../lib/interfaces'

function toMeta({ id, label, description, category, tags, moduleId }: TemplateMeta): TemplateMeta {
  return { id, label, description, category, tags, moduleId }
}

export const metadata = {
  path: '/pdf-generators/templates',
  GET: { requireAuth: true, requireFeatures: ['pdf_generators.view'] },
}

export async function GET() {
  return NextResponse.json({
    internal: getInternalTemplates().map(toMeta),
    external: getExternalTemplates().map(toMeta),
  })
}

export const openApi: OpenApiRouteDoc = {
  methods: {
    GET: {
      summary: 'List available PDF templates grouped by source',
      responses: [
        { status: 200, description: '{ internal: TemplateMeta[], external: TemplateMeta[] }' },
        { status: 401, description: 'Unauthorized' },
      ],
    },
  },
}
