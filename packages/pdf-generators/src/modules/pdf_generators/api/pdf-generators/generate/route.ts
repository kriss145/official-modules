import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { NextResponse } from 'next/server'
import '../../../config/registry' // registers built-in templates as side effect
import { templateRegistry } from '../../../lib/template-registry'
import type { TemplateId } from '../../../lib/types'

export const metadata = {
  path: '/pdf-generators/generate',
  POST: { requireAuth: true, requireFeatures: ['pdf_generators.view'] },
}

/**
 * Generates a PDF document for the given template and record.
 *
 * @param request - Request body: `{ template_id: TemplateId, record: unknown }`
 * @returns PDF binary stream or JSON error response
 */
export async function POST(request: Request) {
  const container = await createRequestContainer()
  
  let body: { template_id: TemplateId; data: unknown }

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
    template = await templateRegistry.load({ id: template_id, data }, { container: container })
  } catch {
    return NextResponse.json({ error: `Unknown template: ${template_id}` }, { status: 400 })
  }

  const element = React.createElement(template.component, { data: template.data }) as React.ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${template.filename}"`,
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
