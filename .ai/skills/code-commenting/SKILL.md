---
name: code-commenting
description: Conventions for commenting TypeScript code in @open-mercato/* community modules. Use when writing or reviewing comments, JSDoc, or inline annotations. Triggers on "add comments", "document method", "jsdoc", "how to comment", "commenting conventions".
---

# Code Commenting Conventions

**Comment the WHY, never the WHAT.** If removing a comment wouldn't confuse a future reader, don't write it.

## When to comment

✅ Hidden constraint, non-obvious invariant, initialization order dependency, deliberately rejected decision, side-effect import.  
❌ Obvious code, task/issue references, restating the type signature.

## Inline comments

One line, sentence fragment, no trailing period. Never `/* ... */` for inline use.

```ts
// globalThis used — Next.js server and client share no module state
```

## JSDoc

Use on all exported symbols and public methods of exported classes.

**Classes** — multi-line, `@param` for constructor args:
```ts
/**
 * Registry for PDF templates
 *
 * @param id - Registry ID (default: "base")
 */
class TemplateRegistry { ... }
```

**Methods** — multi-line, include `@param`, `@returns`, `@throws` when they add clarity:
```ts
/**
 * Loads a template by ID.
 *
 * @param id - Template ID
 * @returns Loaded template with normalized data
 * @throws Error if template is not found
 */
async load(id: string, record: unknown): Promise<LoadedTemplate>
```

**Exported constants** — single line:
```ts
/** Singleton registry for PDF templates — use this to register, query, and load templates. */
export const templateRegistry = new TemplateRegistry()
```

**Internal classes** (not exported from `src/index.ts`) — no JSDoc needed.  
**File-level comments** — never.

## Side-effect imports

```ts
import '../config/registry' // registers built-in templates into templateRegistry
```

## TODOs

```ts
// TODO: move to async queue — renderToBuffer is synchronous and blocks for large docs
```

Format: `// TODO: <what> — <why>`. Only `TODO`, never `FIXME`/`HACK`/`NOTE`.
