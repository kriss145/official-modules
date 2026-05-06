export const metadata = {
  requireAuth: true,
  requireFeatures: ['pdf_generators.view'],
  pageTitle: 'PDF Generators',
  pageTitleKey: 'pdf_generators.page.title',
  pageGroup: 'PDF Generators',
  pageGroupKey: 'pdf_generators.page.group',
  pageOrder: 900,
  breadcrumb: [
    { label: 'PDF Generators', labelKey: 'pdf_generators.page.title' },
  ],
} as const
export default metadata
