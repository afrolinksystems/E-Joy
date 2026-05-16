export function buildPickupCode(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}
