import type { TemplateRegistryEntry } from './interfaces'

const INTERNAL_KEY = '__openMercatoPdfGeneratorsInternal__'
const EXTERNAL_KEY = '__openMercatoPdfGeneratorsExternal__'

function readGlobal<T>(key: string): T[] {
  try {
    const value = (globalThis as Record<string, unknown>)[key]
    return Array.isArray(value) ? (value as T[]) : []
  } catch {
    return []
  }
}

function writeGlobal<T>(key: string, entries: T[]): void {
  try {
    ;(globalThis as Record<string, unknown>)[key] = entries
  } catch {}
}

export function registerInternalTemplates(entries: TemplateRegistryEntry[]): void {
  writeGlobal(INTERNAL_KEY, entries)
}

export function registerExternalTemplates(entries: TemplateRegistryEntry[]): void {
  writeGlobal(EXTERNAL_KEY, entries)
}

export function getInternalTemplates(): TemplateRegistryEntry[] {
  return readGlobal<TemplateRegistryEntry>(INTERNAL_KEY)
}

export function getExternalTemplates(): TemplateRegistryEntry[] {
  return readGlobal<TemplateRegistryEntry>(EXTERNAL_KEY)
}

export function getAllTemplates(): TemplateRegistryEntry[] {
  return [...getInternalTemplates(), ...getExternalTemplates()]
}
