/** Display: cents → Birr. */
export function centsToBirrDisplay(cents: number): string {
  return (cents / 100).toFixed(2)
}

/** Submit to API: Birr → integer cents. */
export function birrInputToCents(birr: string | number): number {
  const n = typeof birr === 'string' ? Number(birr.replace(/,/g, '')) : birr
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100)
}
