export function downloadBlob(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.pdf`
  a.click()
}
