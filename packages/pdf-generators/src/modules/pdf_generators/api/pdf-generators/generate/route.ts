import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { NextResponse } from 'next/server'
import '../../../config/registry' // registers built-in templates as side effect
import { templateRegistry } from '../../../lib/template-registry'
import type { TemplateId } from '../../../lib/template-registry'

export const metadata = {
  path: '/pdf-generators/generate',
  POST: { requireAuth: true, requireFeatures: ['pdf_generators.view'] },
}

export async function POST(request: Request) {
  let body: { template_id: TemplateId; record: unknown }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { template_id, record } = body

  if (!template_id || !record) {
    return NextResponse.json({ error: 'Missing template_id or record' }, { status: 400 })
  }

  let template
  try {
    template = await templateRegistry.load(template_id, record)
  } catch {
    return NextResponse.json({ error: `Unknown template: ${template_id}` }, { status: 400 })
  }

  const element = React.createElement(template.component, { data: template.data }) as React.ReactElement<DocumentProps>
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
        { status: 400, description: 'Missing or invalid template_id / record' },
        { status: 401, description: 'Unauthorized' },
      ],
    },
  },
}
