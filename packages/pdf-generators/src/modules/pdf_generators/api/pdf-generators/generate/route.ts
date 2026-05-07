import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { NextResponse } from 'next/server'
import { loadTemplate, type TemplateId } from '../../../lib/templates'

export const metadata = {
  path: '/pdf-generators/generate',
  POST: { requireAuth: true, requireFeatures: ['pdf_generators.view'] },
}

export async function POST(request: Request) {
  let body: { template_id: TemplateId; data: Record<string, unknown> }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { template_id, data } = body

  if (!template_id || !data) {
    return NextResponse.json({ error: 'Missing template_id or data' }, { status: 400 })
  }

  let template
  try {
    template = await loadTemplate(template_id)
  } catch {
    return NextResponse.json({ error: `Unknown template: ${template_id}` }, { status: 400 })
  }

  const element = React.createElement(template.component, { data }) as React.ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${template_id}.pdf"`,
    },
  })
}

export const openApi: OpenApiRouteDoc = {
  methods: {
    POST: {
      summary: 'Generate PDF document',
      responses: [
        { status: 200, description: 'PDF file stream' },
        { status: 400, description: 'Missing or invalid template_id / data' },
        { status: 401, description: 'Unauthorized' },
      ],
    },
  },
}
