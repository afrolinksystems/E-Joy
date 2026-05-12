const KEY = "mawa:cart";

export type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export function readCart(): CartLine[] {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is CartLine =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as CartLine).productId === "string" &&
        typeof (row as CartLine).name === "string" &&
        typeof (row as CartLine).unitPrice === "number" &&
        typeof (row as CartLine).quantity === "number",
    );
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]): void {
  window.sessionStorage.setItem(KEY, JSON.stringify(lines));
}

export function clearCart(): void {
  window.sessionStorage.removeItem(KEY);
}

export function addLine(productId: string, name: string, unitPrice: number, qty = 1): void {
  const cart = readCart();
  const idx = cart.findIndex((l) => l.productId === productId);
  if (idx === -1) {
    writeCart([...cart, { productId, name, unitPrice, quantity: qty }]);
    return;
  }
  const next = [...cart];
  next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
  writeCart(next);
}
