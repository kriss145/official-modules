import { NextResponse } from 'next/server'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import type { PdfDocumentData } from '../../../../../lib/types'

export const metadata = {
  path: '/pdf-generators/quote-data/[id]',
  GET: { requireAuth: true, requireFeatures: ['pdf_generators.view'] },
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { id } = await params

  const data: PdfDocumentData = {
    document: {
      number: `Q-2026/00${id.slice(-1)}`,
      date: '06.05.2026',
      validUntil: '06.06.2026',
    },
    client: {
      name: 'Jan Kowalski',
      email: 'jan@example.com',
      company: 'Przykładowa Firma Sp. z o.o.',
    },
    seller: {
      name: 'Krzysztof Polak',
      company: 'Codee',
      email: 'chris@iamcodee.co',
      phone: '(+48) 501 155 812',
    },
    lines: [
      {
        title: 'Medusa.js Development',
        description: 'Implementacja modułu e-commerce opartego na Medusa.js',
        quantity: 20,
        unitPrice: 260,
        total: 5200,
        currency: 'PLN',
      },
      {
        title: 'Konsultacje architektoniczne',
        description: 'Przegląd architektury i rekomendacje techniczne',
        quantity: 4,
        unitPrice: 350,
        total: 1400,
        currency: 'PLN',
      },
    ],
    totals: {
      subtotal: 6600,
      tax: 1518,
      total: 8118,
      currency: 'PLN',
    },
    notes: 'Ceny netto. Faktura płatna w ciągu 14 dni od wystawienia.',
  }

  return NextResponse.json({ data })
}

export const openApi: OpenApiRouteDoc = {
  GET: {
    summary: 'Get quote data for PDF generation',
    responses: {
      200: { description: 'PdfDocumentData mapped from Quote' },
      401: { description: 'Unauthorized' },
    },
  },
}
