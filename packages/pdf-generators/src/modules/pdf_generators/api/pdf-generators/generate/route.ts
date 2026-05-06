import React from 'react'
import { renderToBuffer, Font } from '@react-pdf/renderer'
import { fileURLToPath } from 'url'
import path from 'path'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { MyDocument } from '../../../widgets/MyDocument'
import { NextResponse } from 'next/server'

export const metadata = {
  path: '/pdf-generators/generate',
  GET: { requireAuth: true, requireFeatures: ['pdf_generators.view'] },
}

export async function GET(_request: Request) {
  const buffer = await renderToBuffer(React.createElement(MyDocument))

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="document.pdf"',
    },
  })
}

export const openApi: OpenApiRouteDoc = {
  GET: {
    summary: 'Generate PDF document',
    responses: {
      200: { description: 'PDF file stream' },
      401: { description: 'Unauthorized' },
    },
  },
}
