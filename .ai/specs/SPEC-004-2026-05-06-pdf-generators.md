# SPEC-004: PDF Generators

## TLDR
**Key Points:**
- The `@open-mercato/pdf-generators` module generates personalized PDF documents (sales offers) from data fetched from the `sales` module (Quote).
- An admin selects a Quote, picks a template, previews the PDF live in the browser, then generates and downloads the final file.

**Scope:**
- Fetching Quote data via the existing `/api/quotes` API
- Template registry (code-defined, not database-driven)
- Live PDF preview with real Quote data (`PDFViewer` client-side)
- Final PDF generation via API (server-side `renderToBuffer`)
- History of generated documents (tenant-scoped)
- Action widget injected into the Quote detail view in the `sales` module

**Concerns:**
- `@react-pdf/renderer` operates client-side (`PDFViewer`) and server-side (`renderToBuffer`) — requires dynamic import with `ssr: false` in Next.js
- Large documents may render slowly on the server — an async queue or streaming may be needed in a later phase

---

## Overview

The `pdf_generators` module extends OpenMercato with the ability to generate professional, branded PDF documents from sales data. The entry point is the Quote detail view in the `sales` module — a "Generate PDF" button opens a wizard: template selection → live preview → generate.

Templates are defined as React components (JSX) inside the package. Each template is a self-contained component receiving a standardized `PdfDocumentData` object. The list of available templates comes from a registry declared in code.

**Market Reference:** Pandadoc, Qwilr, Proposify are the category leaders. Adopted: live preview before generating, client data personalization. Rejected: drag-and-drop editor (excessive complexity for MVP), cloud storage (files returned directly as a stream).

---

## Problem Statement

OpenMercato does not offer native PDF document generation. Sales teams must manually create proposals in external tools (Word, Canva, Pandadoc), which:
- breaks the sales flow (CRM data transcribed by hand),
- prevents per-tenant branding,
- leaves no history of generated documents inside the system.

---

## Proposed Solution

An external community module (`packages/pdf-generators/`) extending OpenMercato via UMES extension points:

1. **Action widget** injected into the Quote detail view — "Generate PDF" button opens the wizard.
2. **Backend page** `/backend/pdf-generators` — document history and template overview.
3. **API routes** inside the module:
   - `GET /api/pdf-generators/templates` — list available templates
   - `POST /api/pdf-generators/generate` — generate PDF (server-side `renderToBuffer`)
   - `GET /api/pdf-generators/documents` — document history
4. **Live preview** — `PDFViewer` component rendered client-side (dynamic import, `ssr: false`).
5. **`PdfGeneratedDocument` entity** — history of generated files (tenant-scoped).

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Templates as code (JSX), not database config | Git-versioned, full typographic control, no visual editor required |
| `renderToBuffer` on the server | Deterministic output, no dependency on client environment |
| `PDFViewer` client-side with dynamic import | Only viable option in Next.js App Router — `ssr: false` is the standard pattern |
| Data fetched via public `/api/quotes/:id` | Module stays independent — no direct imports from `@open-mercato/core` internals |
| Files not stored in object storage | MVP — PDF returned directly as a stream; history stores only metadata |

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| Database-driven templates (HTML/Handlebars) | Cannot handle complex PDF layouts; branding is hard to control |
| Puppeteer / wkhtmltopdf | Much heavier dependencies, headless Chrome issues on servers |
| Storing PDF files in object storage (S3) | Premature complexity for MVP; can be added in Phase 2 |

---

## User Stories / Use Cases

- **A salesperson** wants to open a Quote and generate a PDF offer with one click, so they can send it to a client.
- **A salesperson** wants to preview the PDF before generating it, so they can verify the data is correct.
- **An admin** wants a list of all generated PDFs for auditing and re-downloading.
- **A developer** wants to add a new PDF template by writing a React component, without modifying the core system.

---

## Architecture

```
sales/quotes/:id (detail view)
  └── [Widget Injection: pdf-generators action button]
        ↓ click "Generate PDF"
  PdfGeneratorDrawer (client component)
    ├── GET /api/pdf-generators/templates  → list templates
    ├── GET /api/quotes/:id                → Quote data (existing sales API)
    ├── [PDFViewer — client-side live preview]
    │     └── <SelectedTemplate data={documentData} />
    └── POST /api/pdf-generators/generate
          ├── renderToBuffer() → Buffer
          ├── saves PdfGeneratedDocument (metadata)
          └── returns PDF as application/pdf stream
```

### Commands & Events

- **Command**: `pdf_generators.document.generate`
- **Event**: `pdf_generators.document.generated`

### Quote → PdfDocumentData Normalization

The `/api/quotes/:id` response is normalized by `lib/mapQuoteToDocumentData.ts` into a standardized interface consumed by all templates:

```ts
interface PdfDocumentData {
  document: {
    number: string
    date: string
    validUntil?: string
  }
  client: {
    name: string
    email?: string
    company?: string
    address?: string
  }
  seller: {
    name: string
    company: string
    email: string
    phone?: string
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

---

## Data Models

### PdfTemplate (code registry, not a database entity)

```ts
interface PdfTemplateDefinition {
  id: string          // e.g. 'codee-offer'
  label: string       // e.g. 'Codee Sales Offer'
  description: string
  component: React.ComponentType<{ data: PdfDocumentData }>
}
```

Registry declared in `src/modules/pdf_generators/lib/templates.ts`, exported as an array.

### PdfGeneratedDocument (entity, tenant-scoped)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `organization_id` | string | FK, required on every query |
| `tenant_id` | string | |
| `quote_id` | string | FK to Quote (ID only, no ORM relation) |
| `quote_number` | string | Snapshot of quote number at generation time |
| `template_id` | string | Template ID from registry |
| `template_label` | string | Snapshot of template label |
| `generated_by` | string | User ID |
| `generated_at` | timestamp | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

## API Contracts

### GET /api/pdf-generators/templates

Returns the list of available templates (from code registry, not database).

**Response:**
```json
{
  "data": [
    { "id": "codee-offer", "label": "Codee Sales Offer", "description": "..." }
  ]
}
```

### POST /api/pdf-generators/generate

Generates a PDF from Quote data and the selected template.

**Request:**
```json
{
  "quoteId": "uuid",
  "templateId": "codee-offer"
}
```

**Response:** `Content-Type: application/pdf` — binary PDF stream

**Errors:**
- `400` — missing `quoteId` or `templateId`
- `403` — insufficient permissions for the Quote
- `404` — Quote or template not found
- `500` — render error

### GET /api/pdf-generators/documents

Paginated list of generated documents for the current tenant.

**Query params:** `?quoteId=uuid` (optional filter)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "quoteId": "uuid",
      "quoteNumber": "Q-2026/001",
      "templateId": "codee-offer",
      "templateLabel": "Codee Sales Offer",
      "generatedBy": "uuid",
      "generatedAt": "2026-05-06T12:00:00Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "pageSize": 50 }
}
```

---

## UMES Extension Points

| Extension Point | Usage |
|----------------|-------|
| **Widget Injection** | Action button in Quote detail view (`quote-detail:actions`) |
| **Backend Page** | `/backend/pdf-generators` — history and template overview |
| **Custom Entity** | `PdfGeneratedDocument` — generation history |
| **Events** | `pdf_generators.document.generated` |
| **ACL Features** | `pdf_generators.view`, `pdf_generators.generate` |

---

## Internationalization (i18n)

Keys in `src/modules/pdf_generators/i18n/`:
- `pdf_generators.page.title` → `PDF Generators`
- `pdf_generators.generate.button` → `Generate PDF`
- `pdf_generators.template.select` → `Select template`
- `pdf_generators.preview.title` → `Document preview`
- `pdf_generators.history.title` → `Document history`

---

## UI/UX

### Widget in Quote detail view

A "Generate PDF" button in the Quote actions section. Opens a `Sheet` (drawer) with a 3-step wizard:

1. **Step 1 — Select template**: card list with template name and description.
2. **Step 2 — Live preview**: `PDFViewer` renders the PDF with Quote data. "Generate & Download" button.
3. **Step 3 — Confirmation**: spinner during generation → auto-download on completion.

### Page /backend/pdf-generators

- History table: Quote Number, Template, Generated By, Date, "Regenerate" button.
- No template configuration via UI (templates = code).

---

## Configuration

No required env vars. Optionally in the future:
- `PDF_GENERATORS_MAX_PAGES` — page limit per document (abuse protection)

---

## Migration & Compatibility

- New entity `PdfGeneratedDocument` — migration `CREATE TABLE pdf_generated_documents`.
- No changes to existing modules (`sales`, `core`).
- Widget injection uses the extension point `quote-detail:actions` — requires verification that this spot ID exists in the `sales` module.

---

## Implementation Plan

### Phase 1 — Module Foundation

1. Add `@react-pdf/renderer` dependency to `package.json`.
2. Define `PdfDocumentData` and `PdfTemplateDefinition` interfaces in `lib/types.ts`.
3. Declare `PdfGeneratedDocument` entity in `data/entities.ts`.
4. Generate and apply DB migration.
5. Update `acl.ts` with features `pdf_generators.view` and `pdf_generators.generate`.
6. Update `setup.ts` with `defaultRoleFeatures` (admin, superadmin).
7. Create `events.ts` with event `pdf_generators.document.generated`.

### Phase 2 — Templates & API

1. Port JSX components from `/codee/offer` project into `src/modules/pdf_generators/templates/codee-offer/`.
2. Adapt components to the `PdfDocumentData` interface.
3. Register the template in `lib/templates.ts`.
4. Write `lib/mapQuoteToDocumentData.ts` mapper.
5. Implement `GET /api/pdf-generators/templates`.
6. Implement `POST /api/pdf-generators/generate` (renderToBuffer + metadata save).
7. Implement `GET /api/pdf-generators/documents`.

### Phase 3 — UI

1. `PdfPreview.tsx` component (dynamic import, `ssr: false`) wrapping `PDFViewer`.
2. `PdfGeneratorDrawer.tsx` — 3-step wizard (select → preview → generate).
3. Widget injection into Quote detail view (`widgets/injection/quote-generate-pdf.tsx`).
4. Backend page `/backend/pdf-generators` — document history table.
5. Verify `quote-detail:actions` spot ID exists in the `sales` module; if not — fallback to backend page entry point or propose adding the spot to core.

### Phase 4 — Sandbox Smoke Test

1. Add module to `apps/sandbox/src/modules.ts`.
2. Run `yarn generate` + `yarn dev`.
3. Test full flow: Quote detail → drawer → template select → preview → generate → history.
4. Remove sandbox entry before opening PR.

### File Manifest

| File | Action | Purpose |
|------|--------|---------|
| `src/modules/pdf_generators/lib/types.ts` | Create | PdfDocumentData, PdfTemplateDefinition interfaces |
| `src/modules/pdf_generators/lib/templates.ts` | Create | Template registry |
| `src/modules/pdf_generators/lib/mapQuoteToDocumentData.ts` | Create | Quote API response → PdfDocumentData |
| `src/modules/pdf_generators/data/entities.ts` | Create | PdfGeneratedDocument entity |
| `src/modules/pdf_generators/data/validators.ts` | Create | Zod schemas for API inputs |
| `src/modules/pdf_generators/data/migrations/` | Create | SQL migration |
| `src/modules/pdf_generators/acl.ts` | Modify | Add view + generate features |
| `src/modules/pdf_generators/setup.ts` | Modify | defaultRoleFeatures |
| `src/modules/pdf_generators/events.ts` | Create | pdf_generators.document.generated event |
| `src/modules/pdf_generators/templates/codee-offer/` | Create | Ported JSX template components |
| `src/modules/pdf_generators/api/get/pdf-generators/templates.ts` | Create | GET templates |
| `src/modules/pdf_generators/api/post/pdf-generators/generate.ts` | Create | POST generate |
| `src/modules/pdf_generators/api/get/pdf-generators/documents.ts` | Create | GET history |
| `src/modules/pdf_generators/widgets/PdfPreview.tsx` | Create | PDFViewer (ssr: false) |
| `src/modules/pdf_generators/widgets/PdfGeneratorDrawer.tsx` | Create | 3-step wizard |
| `src/modules/pdf_generators/widgets/injection/quote-generate-pdf.tsx` | Create | Quote action widget |
| `src/modules/pdf_generators/widgets/injection-table.ts` | Create | Spot → widget mapping |
| `src/modules/pdf_generators/backend/pdf-generators/page.tsx` | Modify | Document history page |

---

## Risks & Impact Review

### Data Integrity Failures

- **PDF generation vs metadata save**: `renderToBuffer` may succeed while the `PdfGeneratedDocument` insert fails. Mitigation: save metadata before returning the stream — if the insert fails, return 500 (no file sent).
- **Deleted Quote**: a Quote may be deleted after the wizard opens. Mitigation: `POST /generate` verifies Quote existence before rendering; returns 404 with a clear message.

### Cascading Failures & Side Effects

- **Sales API unavailability**: the mapper requires data from `/api/quotes/:id`. If the API is down, the wizard shows an error. No impact on other modules — the module emits no blocking events.
- **Large documents (many line items)**: `renderToBuffer` may be slow. MVP has no timeout — an async queue or page limit can be added in Phase 2.

### Tenant & Data Isolation Risks

- `PdfGeneratedDocument` has `organization_id` — all queries are filtered by it. Residual risk: low.
- Templates are per-code (not per-tenant) — no cross-tenant data leakage risk.

### Migration & Deployment Risks

- New table `pdf_generated_documents` — additive migration, no risk to existing data.
- `@react-pdf/renderer` adds ~500 KB to the bundle. Dynamic import with `ssr: false` minimizes SSR impact.

### Operational Risks

- PDF generation is synchronous on the server and may block a worker under heavy load. Acceptable for MVP; Phase 2 can move this to a queue (`@open-mercato/queue`).

#### Risk: Spot ID `quote-detail:actions` does not exist

- **Scenario**: Widget injection requires a defined spot ID in the `sales` module. If the spot does not exist, the widget will not appear in the UI.
- **Severity**: High
- **Affected area**: Entire entry flow into the PDF wizard
- **Mitigation**: Verify in Phase 3 Step 5. Fallback: entry point via backend page instead of widget injection.
- **Residual risk**: Adding a spot to `packages/core` is out of community module scope. In that case, the entry point is the backend page.

---

## Final Compliance Report — 2026-05-06

### AGENTS.md Files Reviewed
- `AGENTS.md` (root)
- `packages/core/AGENTS.md`
- `packages/ui/AGENTS.md`
- `packages/shared/AGENTS.md`

### Compliance Matrix

| Rule Source | Rule | Status | Notes |
|-------------|------|--------|-------|
| root AGENTS.md | No direct ORM relationships between modules | Compliant | `quote_id` as string FK only |
| root AGENTS.md | Filter by organization_id | Compliant | All queries scoped |
| root AGENTS.md | Validate inputs with zod | Compliant | Validators in `data/validators.ts` |
| root AGENTS.md | API routes MUST export openApi | Compliant | Planned for all 3 routes |
| root AGENTS.md | Module code in `packages/<name>/` | Compliant | `packages/pdf-generators/` |
| root AGENTS.md | `defaultRoleFeatures` in setup.ts | Compliant | admin + superadmin |
| root AGENTS.md | Never hardcode user-facing strings | Compliant | All strings via `useT()` |
| packages/ui/AGENTS.md | dynamic import with ssr:false for client-only libs | Compliant | PDFViewer wrapped in dynamic import |
| root AGENTS.md | No code directly in apps/mercato/src/ | Compliant | Code lives in packages/ |

### Internal Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| Data models match API contracts | Pass | PdfGeneratedDocument matches GET /documents response |
| API contracts match UI/UX section | Pass | Drawer calls POST /generate and GET /templates |
| Risks cover all write operations | Pass | POST /generate covered |
| Commands defined for all mutations | Pass | `pdf_generators.document.generate` |
| Spot ID exists in `sales` module | Needs verification | To be confirmed in Phase 3 |

### Non-Compliant Items

No blockers. One item requires verification:
- **Spot ID `quote-detail:actions`**: must be confirmed in the `sales` module. If absent — fallback to backend page entry point without widget injection.

### Verdict

**Fully compliant** — ready for implementation pending spot ID verification in Phase 3.

---

## Changelog

### 2026-05-06
- Initial specification
