/** `unitPrice` from order-service is integer cents (ETB minor units). */
export function formatEtbFromCents(cents: number): string {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
