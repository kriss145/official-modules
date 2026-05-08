export function formatDate(iso: string, locale = 'pl-PL'): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}
