# SPEC-004: PDF Generators

## TLDR
**Key Points:**
- The `@open-mercato/pdf-generators` module is a **universal PDF generation engine** — any module in OpenMercato can inject a widget that generates PDFs from its own data.
- A user opens a PDF tab in any supported detail view, picks a template from a list, previews the PDF live, then downloads the final file.
- Quote/Sales is the first supported module; Orders, Invoices, or any other entity can be added independently.

**Scope:**
- Universal template registry — globalThis-based, split into **internal** (built-in) and **external** (injected by other modules via code-gen) registries
- Widget passes raw `context.record` to the API — normalization (`normalizeRecord`) happens server-side inside `loadTemplate()`
- `GET /api/pdf-generators/templates` — lists available templates (internal + external) for client-side consumption
- `POST /api/pdf-generators/generate` — accepts `{ template_id, record }`, normalizes server-side, renders via `renderToBuffer`, returns PDF blob
- Live PDF preview via `<Preview>` (iframe with blob URL) — no `PDFViewer` client-side rendering
- Widget pattern: tab injection (`quote_pdf_tab`) rather than action button
- Template folder convention: `templates/<module>/<entity>/templates/<template-name>/` + `templates/<module>/<entity>/data/`
- Generator plugin (`generators.ts`) enabling other modules to register external templates via `mercato generate registry`

**Concerns:**
- `@react-pdf/renderer` operates server-side only (`renderToBuffer`) — fonts must be accessible on the server; solved via base64-encoded `*.generated.ts` font files
- Large documents may render slowly on the server — async queue may be needed in a later phase

---

## Overview

The `pdf_generators` module extends OpenMercato with the ability to generate professional, branded PDF documents from any entity in the system. A "Generate PDF" button can be injected into any detail view — it opens a dialog: template selection → live preview → download.

Templates are defined as React components (JSX) inside the package, organized by module and entity: `templates/<module>/<entity>/templates/<template-name>/`. Each template defines its own data shape (`PdfDocumentData` in `types.ts`). Available templates are served via `GET /api/pdf-generators/templates` which reads two globalThis-backed registries: **internal** (registered at module init from `config/registry.ts`) and **external** (registered at bootstrap by code-generated `pdf-generators.generated.ts`). Each widget filters templates by a `TemplateFilter` (`category`, `tags`, `moduleId`) — not by explicit ID list.

The widget passes raw `context.record` directly to `POST /generate`. The server calls `loadTemplate(template_id, record)` which invokes `entry.normalizeRecord(record)` to normalize data before rendering. Each entity's normalizer lives in `templates/<module>/<entity>/data/normalize-record.ts` — co-located with the record types it transforms.

**Market Reference:** Pandadoc, Qwilr, Proposify are the category leaders. Adopted: live preview before generating, client data personalization. Rejected: drag-and-drop editor (excessive complexity for MVP), cloud storage (files returned directly as a stream).

---

## Problem Statement

OpenMercato does not offer native PDF document generation. Teams must manually create documents in external tools (Word, Canva, Pandadoc), which:
- breaks workflow continuity (data transcribed by hand from the system),
- prevents per-tenant branding,
- leaves no in-system record of generated documents,
- requires a separate integration per document type (quotes, orders, invoices, contracts).

---

## Proposed Solution

An external community module (`packages/pdf-generators/`) extending OpenMercato via UMES extension points:

1. **Tab widgets** — injected into any module's detail view via `injection-table.ts`. Each widget renders a `TemplatesList` component with `record` and `filter` props. Widget passes raw `context.record` — no client-side mapping.
2. **Backend page** `/backend/pdf-generators` — template overview.
3. **Two API routes**:
   - `GET /api/pdf-generators/templates` — returns `{ internal: TemplateMeta[], external: TemplateMeta[] }`
   - `POST /api/pdf-generators/generate` — accepts `{ template_id, record }`, normalizes + renders server-side, returns PDF stream
4. **Live preview** — `PreviewPanel` dialog renders a blob URL from `POST /generate` in a native `<iframe>` (`Preview` component) — no client-side `PDFViewer`.
5. **Generator plugin** (`generators.ts`) — `pdf-generators.templates` plugin enables other modules to register external templates via `mercato generate registry`.

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Templates as code (JSX), not database config | Git-versioned, full typographic control, no visual editor required |
| Data from `context.record`, not a fetch | Widget already receives full record from the framework — no redundant API call |
| Normalization server-side in `loadTemplate()` | Client sends raw `record`; server normalizes before render — validation and mapping at the API boundary, not scattered across the frontend |
| `normalizeRecord` per entity in `templates/<module>/<entity>/data/` | Co-located with the record types it consumes; reusable by all templates for the same entity |
| `PdfDocumentData` lives in `templates/<module>/<entity>/templates/<name>/types.ts` | Type is a contract between the normalizer and the template component, not a global concern |
| `Record<string, unknown>` in route and components | Route and UI components are template-agnostic; type safety lives at the normalizer→template boundary |
| Template folder convention `templates/<module>/<entity>/templates/<name>/` | Mirrors the domain hierarchy — adding a new module = new top-level folder, no changes elsewhere |
| globalThis-based dual registry (internal + external) | Decoupled: internal templates ship with the module; external templates are injected at bootstrap from generated code |
| `GET /api/pdf-generators/templates` endpoint | Client needs the list at runtime to filter and display available templates without bundling the registry |
| `generators.ts` plugin for code-gen | External modules declare templates in `pdf-generators.ts`; `mercato generate registry` produces the bootstrap glue |
| `moduleId` = target module, not source package | A template declares which module's data it consumes (`'quotes'`, `'orders'`) — not which package ships it. Widgets filter by `moduleId` to get only templates compatible with their data shape. |
| `fromRecord` in registry entry (server-side) | Template owns its normalization logic — widget is fully decoupled from data shape. Adding a new template for `quotes` requires zero changes to the widget. |
| Tab widget (`quote_pdf_tab`) not action button | PDF is a contextual view of the record, not a one-shot action |
| Preview via iframe + blob URL, not PDFViewer | Server renders the PDF once (`renderToBuffer`), iframe displays the result — no client-side re-render on every change |
| Fonts as base64 `*.generated.ts` per font | Works on the server (no filesystem path issues); tree-shakeable per font |
| `renderToBuffer` on the server | Deterministic output, no dependency on client environment |
| Files not stored in object storage | MVP — PDF returned directly as stream |

---

## User Stories / Use Cases

- **A salesperson** wants to open a Quote and generate a PDF offer with one click.
- **An operations user** wants to generate a PDF from an Order, Invoice, or any other entity.
- **A user** wants to preview the PDF before downloading to verify the data.
- **A developer** wants to add a new PDF template by writing a React component and one registry entry — no other file changes required.
- **A developer** wants to add PDF generation to any module by creating a widget folder with `toDocumentData()`, `types.ts`, and `templateIds` — fully independent of other widgets.

---

## Architecture

```
<any module>/:id (detail view)
  └── [Widget Injection: <module>_pdf_tab]
        ↓ tab renders
  <ModulePdfTabWidget>
    └── TemplatesList(record, filter)
          ├── GET /api/pdf-generators/templates → TemplateMeta[] (filtered by TemplateFilter)
          ├── TemplatesListView → TemplateListItem (click to select)
          └── PreviewPanel(template, record)
                ├── POST /api/pdf-generators/generate { template_id, record }
                │     ├── loadTemplate(template_id, record)
                │     │     ├── entry.fromRecord(record) → data  [normalization server-side]
                │     │     └── entry.load() → Component
                │     ├── renderToBuffer(<Component data={data} />)
                │     └── returns application/pdf stream
                ├── Preview (iframe with blob URL)
                └── DownloadButton → downloadBlob(blobUrl, filename)
```

### Module Structure

```
src/modules/pdf_generators/
├── config/
│   └── registry.ts              # internal REGISTRY array — add templates here
├── lib/
│   ├── interfaces.ts            # TemplateMeta, TemplateRegistryEntry, PdfTemplateDefinition
│   ├── types.ts                 # TemplateId (derived from REGISTRY)
│   ├── templates.ts             # getTemplateMetas(), loadTemplate()
│   └── template-registry.ts    # globalThis-based internal/external registry
├── components/
│   ├── TemplatesList.tsx        # Fetches templates, filters, shows list + opens PreviewPanel
│   ├── TemplatesListView.tsx    # Grid of TemplateListItem cards
│   ├── TemplatesListLoader.tsx  # Loading skeleton
│   ├── TemplateListItem.tsx     # Single template card
│   ├── PreviewPanel.tsx         # Fullscreen dialog: fetch blob → Preview + download
│   ├── Preview.tsx              # iframe rendering blob URL
│   └── Loader.tsx               # Spinner used in PreviewPanel while fetching
├── templates/
│   ├── shared/
│   │   └── fonts/
│   │       ├── Inter-Regular.ttf
│   │       ├── Inter-Regular.generated.ts   # base64 data URI (build-generated)
│   │       └── ...
│   └── sales/                   # top-level module (e.g. sales, orders)
│       └── quotes/              # entity within the module
│           ├── data/
│           │   ├── types.ts     # QuoteWidgetRecord, QuoteWidgetContext
│           │   └── normalize-record.ts  # normalizeRecord(record) → PdfDocumentData shape
│           └── templates/
│               └── sales-offer/
│                   ├── types.ts # PdfDocumentData (template-specific contract)
│                   ├── theme.ts # Font.register() + color tokens
│                   ├── index.tsx# SalesOfferDocument component
│                   ├── CoverPage.tsx
│                   └── QuotePage.tsx
├── widgets/
│   ├── injection-table.ts       # spot → widget mapping
│   └── injection/
│       └── quote_pdf_tab/
│           ├── widget.ts        # widget metadata (id: pdf_generators.injection.quote_pdf_tab)
│           └── widget.client.tsx# QuotePdfTabWidget — renders TemplatesList
├── utils/
│   └── downloadBlob.ts         # downloadBlob(url, filename) — triggers browser download
├── generators.ts                # GeneratorPlugin for pdf-generators.templates (code-gen)
├── api/
│   └── pdf-generators/
│       ├── generate/
│       │   └── route.ts         # POST /api/pdf-generators/generate
│       └── templates/
│           └── route.ts         # GET /api/pdf-generators/templates
├── backend/
│   └── pdf-generators/
│       └── page.tsx             # /backend/pdf-generators
└── acl.ts
```

---

## Data Contracts

### Template Registry

Two separate registries backed by `globalThis`:

```ts
// lib/template-registry.ts
registerInternalTemplates(entries: TemplateRegistryEntry[]): void  // called by config/registry.ts at init
registerExternalTemplates(entries: TemplateRegistryEntry[]): void  // called by bootstrap (generated code)
getInternalTemplates(): TemplateRegistryEntry[]
getExternalTemplates(): TemplateRegistryEntry[]
getAllTemplates(): TemplateRegistryEntry[]
```

```ts
// lib/interfaces.ts
interface TemplateMeta {
  id: string
  label: string
  description: string
  category: string      // e.g. 'quote', 'order', 'invoice'
  tags: string[]        // e.g. ['offer', 'sales', 'b2b']
  moduleId: string      // target module whose data this template consumes — e.g. 'quotes', 'orders'
}

interface TemplateRegistryEntry extends TemplateMeta {
  fromRecord: (record: unknown) => Record<string, unknown>  // maps raw context.record to template data shape
  load: () => Promise<React.ComponentType<{ data: Record<string, unknown> }>>
}

interface TemplateFilter {
  category?: string
  tags?: string[]       // OR logic — matches if template has ANY of the given tags
  moduleId?: string
}
```

Adding a built-in template = one object in `config/registry.ts`. Adding an external template (from another module) = define a `pdf-generators.ts` convention file and run `mercato generate registry`.

### Template-specific Data Shape

Each template defines its own `PdfDocumentData` in `templates/<name>/types.ts`. Example for `sales-offer`:

```ts
// templates/sales-offer/types.ts
interface PdfDocumentData {
  document: { number: string; date: string; validUntil?: string }
  client: { name: string; email?: string; company?: string; address?: string }
  seller: { name: string; company: string; email: string; phone?: string }
  lines: Array<{ title: string; description?: string; quantity: number; unitPrice: number; total: number; currency: string }>
  totals: { subtotal: number; tax: number; total: number; currency: string }
  notes?: string
}
```

### Record Normalizer

Each entity folder contains `normalize-record.ts` — a pure function that maps raw `context.record` to a shape the template understands. Called server-side by `loadTemplate()`:

```ts
// templates/sales/quotes/data/normalize-record.ts
export function normalizeRecord(record: unknown): Record<string, unknown> {
  const r = record as QuoteWidgetRecord
  return { document: { number: r.quoteNumber, ... }, client: { ... }, ... }
}
```

Referenced in `config/registry.ts` as `fromRecord: normalizeRecord` per template entry.

### Widget Context Types

```ts
// templates/sales/quotes/data/types.ts
interface QuoteWidgetRecord { /* fields from context.record */ }
interface QuoteWidgetContext {
  kind: string
  resourceId: string
  resourceKind: string
  record: QuoteWidgetRecord
}
```

`QuoteWidgetRecord` is exported publicly from `@open-mercato/pdf-generators` for use by external template authors.

---

## API Contracts

### GET /api/pdf-generators/templates

Returns all available templates split by source.

**Response:**
```json
{
  "internal": [{ "id": "sales-offer", "label": "Sales Offer", "description": "..." }],
  "external": [{ "id": "custom-invoice", "label": "Custom Invoice", "description": "..." }]
}
```

**Errors:**
- `401` — unauthorized

---

### POST /api/pdf-generators/generate

Generates a PDF. Server normalizes the raw record via `entry.fromRecord(record)` before rendering.

**Request:**
```json
{
  "template_id": "sales-offer",
  "record": { /* raw context.record — module-specific shape */ }
}
```

**Response:** `Content-Type: application/pdf` — binary PDF stream

**Errors:**
- `400` — missing or invalid `template_id` / `record`
- `401` — unauthorized
- `500` — render error

---

## UMES Extension Points

| Extension Point | Usage |
|----------------|-------|
| **Widget Injection** | Any module's detail view — each widget registers its own injection spot in `injection-table.ts` |
| **Backend Page** | `/backend/pdf-generators` — template overview |
| **ACL Features** | `pdf_generators.view`, `pdf_generators.generate` |

---

## Fonts

Fonts live in `templates/shared/fonts/`. Each `.ttf` file has a corresponding `*.generated.ts` file (excluded from git, generated by `build.mjs`) containing a base64 `data:font/truetype` URI.

Templates import individual font files for tree-shaking:

```ts
import InterRegular from '../shared/fonts/Inter-Regular.generated'
```

`build.mjs` generates `*.generated.ts` files before esbuild compilation. No Next.js configuration required — `.ttf` files are never imported directly by the app.

---

## Internationalization (i18n)

| Key | Default |
|-----|---------|
| `pdf_generators.generate.button` | `Generuj PDF` |
| `pdf_generators.template.select` | `Wybierz szablon` |
| `pdf_generators.preview.title` | `Podgląd dokumentu` |
| `pdf_generators.generate.generating` | `Generowanie...` |

---

## UI/UX

### Widget pattern (any module)

A **PDF tab** injected into any detail view via `injection-table.ts`. The tab renders `TemplatesList`:

1. **Template list** — card grid fetched from `GET /api/pdf-generators/templates`, filtered by `TemplateFilter` (`category`, `tags`, `moduleId`) passed as `filter` prop.
2. **Preview dialog** (`PreviewPanel`) — on card click: calls `POST /api/pdf-generators/generate`, displays the result in an `<iframe>` via blob URL. "Pobierz PDF" button triggers `downloadBlob()`.

### Page /backend/pdf-generators

Template overview — list of registered templates with labels and descriptions.

---

## Extending to Other Modules

### Adding a new built-in template for an existing entity

1. Add template component in `templates/<module>/<entity>/templates/<new-template>/`
2. Register in `config/registry.ts` — point `fromRecord` to existing `normalize-record.ts`

No other file changes required.

### Adding PDF generation for a new module/entity (e.g. Orders)

1. Create `templates/orders/orders/data/` with `types.ts` and `normalize-record.ts`
2. Add template component in `templates/orders/orders/templates/<template-name>/`
3. Register in `config/registry.ts`
4. Create `widgets/injection/order_pdf_tab/` with `widget.ts`, `widget.client.tsx`
5. Add entry to `widgets/injection-table.ts`

No changes to existing code required.

### Registering an external template from another module

1. Create `pdf-generators.ts` convention file in the other module exporting a `templates: TemplateRegistryEntry[]` array
2. Run `mercato generate registry` — generates `pdf-generators.generated.ts` with bootstrap registration
3. The bootstrap calls `registerExternalTemplates(...)` — templates appear in `GET /api/pdf-generators/templates` under `external`

---

## Risks & Impact Review

### Data Integrity

- **Slow render**: `renderToBuffer` is synchronous and may be slow for large documents. Acceptable for MVP; Phase 2 can move to `@open-mercato/queue`.
- **Missing line items**: `context.record` does not include line items (only `lineItemCount`). `toDocumentData()` returns empty `lines: []` until core exposes line items in the injection context.

### Tenant & Data Isolation

- No database entities — no tenant isolation risk in this phase.
- Templates are code-defined — no cross-tenant data leakage.

### Font Loading

- `*.generated.ts` files are gitignored and must be regenerated after `build.mjs`. Dev mode requires either running the build or having the files pre-generated. Mitigation: `build.mjs` always regenerates them before esbuild.

### Operational

- `@react-pdf/renderer` adds ~500 KB to the server bundle. Dynamic import of template components (`loadTemplate`) limits client-side impact.

---

## Implementation Plan

### Phase 1 — Foundation ✅

1. Package scaffold (`package.json`, `build.mjs`, `tsconfig.json`)
2. `acl.ts` with `pdf_generators.view`, `pdf_generators.generate`
3. `setup.ts` with `defaultRoleFeatures`
4. Module `index.ts`

### Phase 2 — Templates & Registry ✅

1. `config/registry.ts` — REGISTRY array with `fromRecord` per entry
2. `lib/interfaces.ts`, `lib/types.ts`, `lib/templates.ts` (`loadTemplate(id, record)` normalizes + loads)
3. `templates/shared/fonts/` + font build pipeline in `build.mjs`
4. `templates/sales/quotes/data/` — `types.ts`, `normalize-record.ts`
5. `templates/sales/quotes/templates/sales-offer/` — `types.ts`, `theme.ts`, `CoverPage.tsx`, `QuotePage.tsx`, `index.tsx`

### Phase 3 — API ✅

1. `POST /api/pdf-generators/generate` — accepts `{ template_id, record }`, calls `loadTemplate(id, record)` which normalizes + renders, returns PDF stream
2. `GET /api/pdf-generators/templates` — returns `{ internal: TemplateMeta[], external: TemplateMeta[] }`

### Phase 4 — UI Components ✅

1. `components/TemplatesList.tsx` — fetches templates via `GET /api/pdf-generators/templates`, applies `TemplateFilter` client-side, renders card list
2. `components/TemplatesListView.tsx`, `TemplatesListLoader.tsx`, `TemplateListItem.tsx` — list sub-components
3. `components/PreviewPanel.tsx` — fullscreen dialog: sends `{ template_id, record }` to `POST /generate`, shows `Preview` (iframe) + download button
4. `components/Preview.tsx` — iframe rendering a blob URL
5. `components/Loader.tsx` — spinner
6. `utils/downloadBlob.ts` — triggers browser file download
7. `widgets/injection/quote_pdf_tab/` — first reference widget: `widget.ts`, `widget.client.tsx` (passes raw `record` to `TemplatesList`)
8. `widgets/injection-table.ts` — injection spot mapping

### Phase 4.5 — External Template Code-Gen ✅

1. `generators.ts` — `pdf-generators.templates` GeneratorPlugin
2. Convention file pattern: `pdf-generators.ts` in consuming module exports `templates: TemplateRegistryEntry[]`
3. `mercato generate registry` produces `pdf-generators.generated.ts` that calls `registerExternalTemplates(...)`

### Phase 5 — History & Backend Page (Planned)

1. `PdfGeneratedDocument` entity — `id`, `organization_id`, `tenant_id`, `resource_kind`, `resource_id`, `resource_label`, `template_id`, `template_label`, `generated_by`, `generated_at`
2. DB migration
3. Save metadata in `POST /generate` after successful render (resource kind + ID passed alongside `template_id` and `data`)
4. `GET /api/pdf-generators/documents` — paginated history, filterable by `resource_kind` and `resource_id`
5. Backend page — history table: Resource, Template, Generated By, Date

### Phase 6 — External Storage (Planned)

1. After successful render, upload the PDF buffer to a configured external storage provider (e.g. S3, GCS, or any compatible object store)
2. Store the resulting public/signed URL in `PdfGeneratedDocument.storage_url`
3. `GET /api/pdf-generators/documents/:id/url` — return a fresh signed URL (re-signed if expired)
4. Download button in the widget uses the stored URL when available, falls back to on-demand render otherwise

### Phase 7 — Email & Sharing (Planned)

1. Send PDF directly to a recipient email from the widget — attach generated PDF or include storage URL
2. Shareable link — time-limited public URL for previewing a document without login
3. Bulk generation — generate PDFs for multiple records in a single action via queue worker

### Phase 8 — Advanced Templates (Planned)

1. Template versioning — record which template version was used at generation time; archived versions remain renderable
2. Draft watermark — render a "DRAFT" overlay when the source resource is not in a final status
3. Auto-generation trigger — emit `pdf_generators.document.generated` event on resource status change (e.g. quote accepted)

---

---

## Final Compliance Report — 2026-05-08

### Compliance Matrix

| Rule | Status | Notes |
|------|--------|-------|
| No direct ORM relationships between modules | ✅ | No DB entities yet; FK IDs planned |
| Filter by organization_id | ✅ | Planned for Phase 5 entity |
| Validate inputs with Zod | ✅ | generate route validates template_id + data presence |
| API routes export openApi | ✅ | Both routes export openApi |
| Module code in `packages/<name>/` | ✅ | `packages/pdf-generators/` |
| defaultRoleFeatures in setup.ts | ✅ | |
| Never hardcode user-facing strings | ✅ | All via useT() |
| No direct imports from other module internals | ✅ | Data via context.record only |

### Non-Compliant / Pending

- **Line items missing from context.record**: `normalizeRecord()` returns `lines: []` until core exposes line items in the injection context. Not a blocker — PDF renders correctly with empty lines section.

### Verdict

**Compliant for Phases 1–4 and 4.5.** Phase 5 requires DB entity + migration review before implementation.

---

## Changelog

| Date | Author | Summary |
|------|--------|---------|
| 2026-05-06 | Krzysztof Polak | Spec created — Phases 1–4 designed |
| 2026-05-07 | Krzysztof Polak | Initial compliance report added |
| 2026-05-08 | Krzysztof Polak | Spec updated to match implementation: widget renamed to `quote_pdf_tab` (tab, not action); `PdfGeneratorDrawer` replaced by `TemplatesList` + `PreviewPanel` + `Preview` + `Loader` + `downloadBlob`; data mapper moved to `data/quote-detail/`; `GET /api/pdf-generators/templates` endpoint added; globalThis-based dual registry (`template-registry.ts`) documented; `generators.ts` plugin (Phase 4.5) added |
| 2026-05-08 | Krzysztof Polak | `templateIds` filtering replaced by `TemplateFilter { category, tags, moduleId }` — templates declare `category`, `tags[]`, `moduleId` at registration; `TemplatesList` accepts `filter` prop instead of `templateIds`; OR logic for tags |
| 2026-05-08 | Krzysztof Polak | `fromRecord` mapper moved from `data/quote-detail/document-data.ts` into each `TemplateRegistryEntry` — template owns its own data mapping; widget passes raw `record` to `TemplatesList`; `document-data.ts` removed; `TemplatesList` resolves mapper from globalThis registry on template selection |
| 2026-05-09 | Krzysztof Polak | Normalization moved server-side: `POST /generate` now accepts `{ template_id, record }` instead of `{ template_id, data }`; `loadTemplate(id, record)` calls `entry.fromRecord(record)` server-side; client no longer needs registry import side effect; template folder convention changed to `templates/<module>/<entity>/templates/<name>/` + `templates/<module>/<entity>/data/`; `QuoteWidgetRecord` exported publicly from package root |
