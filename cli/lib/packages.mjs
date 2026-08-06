// Workspace package discovery + per-package config loading for the modules CLI.
//
// Kept dependency-free and framework-agnostic so the command handlers port
// verbatim into the core `mercato` CLI later.
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const repoRoot = resolve(__dirname, '..', '..')
export const packagesDir = join(repoRoot, 'packages')

/** @returns {{ dir: string, name: string, id: string }[]} every workspace package */
export function listPackages() {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesDir, entry.name))
    .filter((dir) => existsSync(join(dir, 'package.json')))
    .map((dir) => {
      const name = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).name
      return { dir, name, id: basename(dir) }
    })
}

/**
 * Resolve package selectors to concrete packages. A selector is a full name
 * (`@open-mercato/pdf-generators`), a short name (`pdf-generators`), or `.`
 * (the package the command is run from). No selectors → every package.
 */
export function resolvePackages(selectors) {
  const all = listPackages()
  if (!selectors || selectors.length === 0) return all

  const cwd = resolve(process.cwd())
  const selected = []
  for (const selector of selectors) {
    const match =
      selector === '.'
        ? all.find((pkg) => resolve(pkg.dir) === cwd)
        : all.find((pkg) => pkg.name === selector || pkg.id === selector)
    if (!match) {
      console.error(`[module] unknown package: "${selector}"`)
      console.error(`         available: ${all.map((pkg) => pkg.id).join(', ')}`)
      process.exit(1)
    }
    selected.push(match)
  }
  return selected
}

/**
 * Load a package's optional `module.config.mjs`. Packages with special build
 * needs (extra loaders, asset copying, post-build hooks) declare them there;
 * the vast majority need no config at all.
 * @returns {Promise<{ build?: object }>}
 */
export async function loadModuleConfig(packageDir) {
  const configPath = join(packageDir, 'module.config.mjs')
  if (!existsSync(configPath)) return {}
  const mod = await import(pathToFileURL(configPath).href)
  return mod.default ?? {}
}
