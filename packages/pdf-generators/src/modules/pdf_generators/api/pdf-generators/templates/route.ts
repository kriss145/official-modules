import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { NextResponse } from 'next/server'
import { getTemplateMetas } from '../../../lib/templates'

export const metadata = {
  path: '/pdf-generators/templates',
  GET: { requireAuth: true, requireFeatures: ['pdf_generators.view'] },
}

export async function GET() {
  return NextResponse.json(getTemplateMetas())
}

export const openApi: OpenApiRouteDoc = {
  methods: {
    GET: {
      summary: 'List available PDF templates',
      responses: [
        { status: 200, description: 'Array of template metadata' },
        { status: 401, description: 'Unauthorized' },
      ],
    },
  },
}
