---
name: scaffold-pdf-templates
description: Scaffold the files needed to add custom PDF templates to an @open-mercato module using the pdf-generators package. Creates a DocumentService, a template component, a types file, the pdf-generators.ts convention file, and an injection widget that renders the TemplatesList. Triggers on "scaffold pdf templates", "add pdf template", "create pdf template", "add invoice template", "add quote template", "pdf widget", "generate pdf".
---

# use-pdf-generators

Scaffolds everything needed for a community module (or sandbox module) to register and render its own PDF templates via `@open-mercato/pdf-generators`.

---

## How it works (conceptual map)

```
pdf-generators.ts          ← convention file picked up by `mercato generate registry`
└── DocumentService        ← extends BaseDocumentService, owns one category of templates
    ├── normalizeRecord()  ← maps raw widget record → flat typed data
    └── registerTemplate() ← lazy-loads the React-PDF component

pdf-templates/
  services/
    {{MODULE_ID}}-{{CATEGORY}}-document-service.ts   ← the service class
  templates/
    {{CATEGORY}}/
      {{TEMPLATE_ID}}/
        index.tsx          ← React-PDF component (<Document><Page>…)
        types.ts           ← TypeScript data shape for the template

widgets/injection/
  {{SLOT_WIDGET_ID}}/
    widget.ts              ← InjectionWidgetModule descriptor
    widget.client.tsx      ← renders <TemplatesList> with record + filter

widgets/injection-table.ts ← declares which slot gets the widget
```

---

## Inputs

| Variable | Format | Example |
|----------|--------|---------|
| `MODULE_ID` | snake_case | `example` |
| `CATEGORY` | singular noun, kebab-case | `invoice` \| `quote` \| `shipment` |
| `TEMPLATE_ID` | kebab-case | `example-invoice` |
| `TEMPLATE_LABEL` | Title Case | `Example Invoice` |
| `SLOT_ID` | injection slot key | `sales.document.detail.order:tabs` |
| `WIDGET_ID` | dot notation | `example.injection.order_pdf_tab` |
| `RECORD_TYPE_NAME` | PascalCase | `OrderWidgetRecord` |

Ask the user for anything that is ambiguous before writing files.

---

## Step 1 — Types file

**`pdf-templates/templates/{{CATEGORY}}/{{TEMPLATE_ID}}/types.ts`**

```ts
/**
 * Data shape expected by the {{TEMPLATE_LABEL}} PDF template.
 */
export interface {{PascalTemplateId}}Data {
  document: {
    number: string
    date: string
    dueDate?: string
  }
  seller: {
    name: string
    company: string
    email: string
  }
  client: {
    name: string
    company?: string
    email?: string
    address?: string
  }
  lines: Array<{
    title: string
    description?: string
    quantity: number
    unitPrice: number
    total: number
    currency: string
  }>
  totals: {
    subtotal: number
    tax: number
    total: number
    currency: string
  }
  notes?: string
}
```

**Why**: Keeping the data shape in a separate `types.ts` lets the service's `normalizeRecord()` and the template component share the same type without circular imports.

---

## Step 2 — Template component

**`pdf-templates/templates/{{CATEGORY}}/{{TEMPLATE_ID}}/index.tsx`**

```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { OpenMercatoLogo } from '@open-mercato/pdf-generators'
import '@open-mercato/pdf-generators/modules/pdf_generators/templates/shared/theme'
import { colors } from '@open-mercato/pdf-generators/modules/pdf_generators/templates/shared/theme'
import type { {{PascalTemplateId}}Data } from './types'

const s = StyleSheet.create({
  page: { paddingHorizontal: 52, paddingVertical: 48, fontSize: 10, fontFamily: 'Inter', color: colors.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 600 },
  // Add more styles as needed
})

export function {{PascalTemplateId}}Document({ data }: { data: {{PascalTemplateId}}Data }) {
  const cur = data.totals.currency
  const fmt = (n: number) => `${n.toFixed(2)} ${cur}`

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>{{TEMPLATE_LABEL}}</Text>
          <OpenMercatoLogo />
        </View>

        {/* Add sections: parties, line items, totals */}
      </Page>
    </Document>
  )
}
```

**Why**:
- `import '@open-mercato/pdf-generators/…/theme'` is a **side-effect import** — it registers the Inter font with `@react-pdf/renderer`. Without it, `fontFamily: 'Inter'` silently falls back to the default font.
- `colors` keeps the template visually consistent with the built-in Open Mercato templates.
- `OpenMercatoLogo` is a pre-built React-PDF component exported from the package.

---

## Step 3 — Document service

**`pdf-templates/services/{{MODULE_ID}}-{{CATEGORY}}-document-service.ts`**

```ts
import { BaseDocumentService } from '@open-mercato/pdf-generators'

/**
 * Raw record shape passed from the widget context for this document category.
 */
interface {{RECORD_TYPE_NAME}} {
  id: string
  // Map fields from the widget's `context.record` here
  [key: string]: unknown
}

/**
 * Document service for the {{MODULE_TITLE}} module.
 *
 * Extend: call this.registerTemplate() in the constructor for each additional template.
 */
export class {{PascalModuleId}}{{PascalCategory}}DocumentService extends BaseDocumentService {
  readonly id = '{{MODULE_ID}}-{{CATEGORY}}s'
  readonly label = '{{MODULE_TITLE}} {{PascalCategory}}s'
  readonly moduleId = '{{MODULE_ID}}'

  constructor() {
    super()

    this.registerTemplate({
      id: '{{TEMPLATE_ID}}',
      label: '{{TEMPLATE_LABEL}}',
      description: 'Short description of what this template produces.',
      category: '{{CATEGORY}}',
      tags: ['{{CATEGORY}}', '{{MODULE_ID}}'],
      load: () =>
        import('../templates/{{CATEGORY}}/{{TEMPLATE_ID}}').then(
          (m) => m.{{PascalTemplateId}}Document as unknown as React.ComponentType<{ data: Record<string, unknown> }>
        ),
    })
  }

  /**
   * Maps a raw widget record into the flat data shape expected by {{CATEGORY}} templates.
   */
  normalizeRecord(record: unknown): Record<string, unknown> {
    const r = record as {{RECORD_TYPE_NAME}}

    return {
      document: {
        number: String(r.id ?? ''),
        date: new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      },
      seller: { name: '', company: '', email: '' },
      client: { name: '' },
      lines: [],
      totals: { subtotal: 0, tax: 0, total: 0, currency: 'PLN' },
    }
  }
}
```

**Why**:
- `BaseDocumentService` provides `getEntries()`, `registerTemplate()`, and the `formatDate()` helper. Never reimplement these.
- `readonly id` must be globally unique across all services — use `{{MODULE_ID}}-{{CATEGORY}}s` as the convention.
- `readonly moduleId` is used by `<TemplatesList filter={{ moduleId }}>` to scope which templates appear in the widget.
- The `load` function must return a **lazy import** (`() => import(…)`) — templates are never eagerly loaded, keeping bundle size small.
- `normalizeRecord` receives the raw `context.record` from the widget context. Shape it to match your `{{PascalTemplateId}}Data` type.

---

## Step 4 — Convention file

**`pdf-generators.ts`** (at module root, sibling of `index.ts`)

```ts
import { {{PascalModuleId}}{{PascalCategory}}DocumentService } from './pdf-templates/services/{{MODULE_ID}}-{{CATEGORY}}-document-service'

// Convention file — picked up by `mercato generate registry` to register external PDF templates.
const service = new {{PascalModuleId}}{{PascalCategory}}DocumentService()

export const templates = service.getEntries()
export default templates
```

**Why**: `mercato generate registry` scans every loaded module for a `pdf-generators.ts` export named `templates`. This is the **only** place auto-discovery reads from. The file must be at the module root (next to `acl.ts`, `setup.ts`, etc.).

---

## Step 5 — Injection widget

### `widgets/injection/{{SLOT_WIDGET_ID}}/widget.ts`

```ts
import type { InjectionWidgetModule } from '@open-mercato/shared/modules/widgets/injection'
import {{PascalWidgetName}}Widget from './widget.client'

const widget: InjectionWidgetModule = {
  metadata: {
    id: '{{WIDGET_ID}}',
    title: 'PDF',
    features: ['pdf_generators.view'],
    priority: 10,
  },
  Widget: {{PascalWidgetName}}Widget,
}

export default widget
```

### `widgets/injection/{{SLOT_WIDGET_ID}}/widget.client.tsx`

```tsx
'use client'

import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { TemplatesList } from '@open-mercato/pdf-generators'

interface WidgetContext {
  kind: string
  resourceId: string
  resourceKind: string
  record: Record<string, unknown>
}

export default function {{PascalWidgetName}}Widget({ context }: InjectionWidgetComponentProps) {
  const ctx = context as WidgetContext
  const record = ctx?.record

  if (!record) return null

  return (
    <div className="border rounded-lg p-4">
      <TemplatesList
        record={record}
        filter={{ category: '{{CATEGORY}}', moduleId: '{{MODULE_ID}}' }}
      />
    </div>
  )
}
```

**Why**:
- `features: ['pdf_generators.view']` gates the tab — users without this feature won't see it.
- `filter={{ category, moduleId }}` scopes the list to only templates registered by this module for this category. Without the filter all registered PDF templates would appear.
- The widget is split into `widget.ts` (server-safe descriptor) and `widget.client.tsx` (`'use client'` boundary) — this is the standard UMES pattern for injection widgets.

---

## Step 6 — Register in injection-table

**`widgets/injection-table.ts`** — add entry for the slot:

```ts
'{{SLOT_ID}}': [
  {
    widgetId: '{{WIDGET_ID}}',
    kind: 'tab',
    priority: 10,
  },
],
```

Common slot IDs for PDF tabs:

| Context | Slot ID |
|---------|---------|
| Sales order detail | `sales.document.detail.order:tabs` |
| Sales quote detail | `sales.document.detail.quote:tabs` |
| Shipment detail | `sales.document.detail.shipment:tabs` |

**Why**: The injection-table is how the widget gets mounted into the host page. Without this entry the widget component exists but is never rendered anywhere.

---

## Step 7 — Verify

```bash
# Rebuild to pick up new files
yarn workspace @open-mercato/{{PACKAGE_NAME}} build   # or: yarn build (for app)

# Regenerate the module registry so pdf-generators.ts is picked up
yarn generate

# Start the sandbox
yarn dev
```

Then navigate to a record that renders the slot (e.g. a sales order detail page) and confirm:
1. The **PDF tab** appears in the tab bar.
2. The tab shows the template name from `registerTemplate({ label })`.
3. Clicking **Generate** produces a PDF without console errors.

---

## File summary

| File | Purpose |
|------|---------|
| `pdf-generators.ts` | Auto-discovery entry point for `mercato generate registry` |
| `pdf-templates/services/…-document-service.ts` | Service: template registration + record normalization |
| `pdf-templates/templates/{{CATEGORY}}/{{TEMPLATE_ID}}/types.ts` | TypeScript data shape for the template |
| `pdf-templates/templates/{{CATEGORY}}/{{TEMPLATE_ID}}/index.tsx` | React-PDF template component |
| `widgets/injection/{{SLOT_WIDGET_ID}}/widget.ts` | Widget descriptor |
| `widgets/injection/{{SLOT_WIDGET_ID}}/widget.client.tsx` | Widget UI (`TemplatesList`) |
| `widgets/injection-table.ts` | Slot registration |

---

## Critical rules

- The `theme` import (`@open-mercato/pdf-generators/…/shared/theme`) **must be a bare side-effect import** — it registers fonts. Do it once, at the top of the template `index.tsx`.
- `load` in `registerTemplate` must be a **function returning a dynamic import** — never a static import, or the whole template bundle loads eagerly.
- `id` in `BaseDocumentService` must be unique globally. Convention: `{{MODULE_ID}}-{{CATEGORY}}s`.
- `pdf-generators.ts` must export `templates` as a named export and a default export.
- Widget `features` must include `pdf_generators.view` — the tab must be gated on the pdf-generators module permission.
- Never import `@react-pdf/renderer` in `widget.client.tsx` — rendering happens inside the template component loaded lazily by `TemplatesList`.
