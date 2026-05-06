import type { ModuleInjectionTable } from '@open-mercato/shared/modules/widgets/injection'

export const injectionTable: ModuleInjectionTable = {
  'sales.document.detail.quote:details': [
    {
      widgetId: 'pdf_generators.injection.quote_generate_pdf',
      priority: 10,
    },
  ],
}

export default injectionTable
