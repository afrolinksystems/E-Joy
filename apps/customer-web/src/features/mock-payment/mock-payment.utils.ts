export function formatEtb(amountCent: number): string {
  return (amountCent / 100).toFixed(2)
}
