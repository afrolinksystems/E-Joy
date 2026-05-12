import { useMemo, useState, type ReactNode } from "react";
import { useMutation } from "@apollo/client/react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { NavigateFn } from "@/pages/types";
import { defaultShopId } from "@/lib/apollo-client";
import { CREATE_ORDER } from "@/graphql/create-order";
import { formatEtbFromCents } from "@/lib/format-etb";
import { clearCart, readCart, writeCart, type CartLine } from "@/lib/mawa-cart";

type Props = { navigate: NavigateFn };

type CreateOrderMutationData = {
  createOrder: {
    ok: boolean;
    error?: { code?: string; message?: string } | null;
    order?: {
      id: string;
      orderNo?: string;
      state?: string;
      paymentState?: string;
      totalAmount?: number;
    } | null;
  };
};

type OrderType = "dine-in" | "pickup" | "delivery";

export function OrderPage({ navigate }: Props) {
  const [orderItems, setOrderItems] = useState<CartLine[]>(() => readCart());
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastOrderNo, setLastOrderNo] = useState<string | null>(null);

  const [createOrder, { loading: submitting }] =
    useMutation<CreateOrderMutationData>(CREATE_ORDER);

  const persistCart = (lines: CartLine[]) => {
    setOrderItems(lines);
    writeCart(lines);
  };

  const subtotalCents = useMemo(
    () => orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [orderItems],
  );

  const canSubmit =
    orderItems.length > 0 &&
    name.trim() &&
    phone.trim() &&
    orderType !== "delivery" &&
    (orderType !== "dine-in" || tableNumber.trim());

  async function handlePlaceOrder() {
    setSubmitError(null);
    setLastOrderNo(null);
    if (!canSubmit) return;

    const idempotencyKey =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const deliveryType =
      orderType === "dine-in" ? "DINE_IN" : orderType === "pickup" ? "PICKUP" : "DELIVERY";

    const guestNote = `Guest: ${name.trim()}, Phone: ${phone.trim()}${
      note.trim() ? `, Note: ${note.trim()}` : ""
    }`;

    const input = {
      shopId: defaultShopId,
      idempotencyKey,
      paymentMethod: "CASH",
      deliveryType,
      tableNumber: orderType === "dine-in" ? tableNumber.trim() : undefined,
      tableId: undefined,
      pickupTime: orderType === "pickup" ? "ASAP" : undefined,
      note: guestNote,
      items: orderItems.map((item) => ({
        productId: item.productId,
        amount: item.quantity,
      })),
    };

    try {
      const result = await createOrder({ variables: { input } });
      const payload = result.data?.createOrder;
      if (!payload) {
        setSubmitError("Order failed: empty response");
        return;
      }
      if (!payload.ok) {
        setSubmitError(payload.error?.message || payload.error?.code || "Order failed");
        return;
      }
      const order = payload.order;
      if (!order?.id) {
        setSubmitError("Order failed: no order returned");
        return;
      }
      clearCart();
      setOrderItems([]);
      setLastOrderNo(order.orderNo ?? order.id);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="bg-[#f3ebdc] pb-16">
      <section className="bg-[#0b3b2d] py-14 text-[#fff8eb] lg:py-20">
        <div className="mawa-container">
          <h1 className="mawa-display text-6xl leading-none sm:text-7xl">Order from Mawa</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[#eadbc6]">
            Build a pickup or dine-in order from the web menu. Table QR ordering stays inside the
            customer mini app, but this page keeps online ordering easy for guests.
          </p>
        </div>
      </section>

      <div className="mawa-container grid gap-6 py-10 lg:grid-cols-[1fr_24rem] lg:py-14">
        <section className="space-y-6">
          <Panel title="Your items" actionLabel="Add more" onAction={() => navigate("/menu")}>
            {orderItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#d8c19e] bg-[#f8efdf] p-10 text-center">
                <p className="mawa-display text-4xl text-[#0b3b2d]">Your cart is empty.</p>
                <Button
                  type="button"
                  onClick={() => navigate("/menu")}
                  className="mt-5 rounded-full bg-[#df9a35] text-[#201914] hover:bg-[#c98222]"
                >
                  Browse menu
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="grid gap-4 rounded-3xl border border-[#eadbc6] bg-[#f8efdf] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <p className="text-lg font-bold text-[#0b3b2d]">{item.name}</p>
                      <p className="mt-1 text-sm text-[#6d6255]">
                        {formatEtbFromCents(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <Stepper
                        value={item.quantity}
                        onMinus={() => {
                          const next = orderItems
                            .map((v, i) =>
                              i === index ? { ...v, quantity: Math.max(0, v.quantity - 1) } : v,
                            )
                            .filter((v) => v.quantity > 0);
                          persistCart(next);
                        }}
                        onPlus={() => {
                          const next = orderItems.map((v, i) =>
                            i === index ? { ...v, quantity: v.quantity + 1 } : v,
                          );
                          persistCart(next);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => persistCart(orderItems.filter((_, i) => i !== index))}
                        className="rounded-full text-[#9a2c1f] hover:bg-[#f1d4c5]"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Order type">
            <div className="grid gap-3 sm:grid-cols-3">
              {(["dine-in", "pickup", "delivery"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={type === "delivery"}
                  onClick={() => setOrderType(type)}
                  className={[
                    "h-14 rounded-2xl border px-4 text-sm font-bold capitalize transition",
                    orderType === type
                      ? "border-[#0b3b2d] bg-[#0b3b2d] text-[#fff8eb]"
                      : "border-[#d8c19e] bg-[#f8efdf] text-[#0b3b2d] hover:bg-[#eadbc6]",
                    type === "delivery" ? "cursor-not-allowed opacity-45" : "",
                  ].join(" ")}
                >
                  {type.replace("-", " ")}
                </button>
              ))}
            </div>
            {orderType === "dine-in" ? (
              <div className="mt-5">
                <label className="text-sm font-bold text-[#0b3b2d]" htmlFor="mawa-table">
                  Table name or number
                </label>
                <Input
                  id="mawa-table"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="mt-2 h-12 rounded-2xl border-[#d8c19e] bg-[#fff8eb]"
                  placeholder="e.g. Hall A12"
                  autoComplete="off"
                />
              </div>
            ) : null}
          </Panel>

          <Panel title="Guest details">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-2xl border-[#d8c19e] bg-[#fff8eb]"
                placeholder="Your name"
                autoComplete="name"
              />
              <Input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-2xl border-[#d8c19e] bg-[#fff8eb]"
                placeholder="Phone"
                autoComplete="tel"
              />
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-4 min-h-28 rounded-2xl border-[#d8c19e] bg-[#fff8eb]"
              placeholder="Any notes for the kitchen?"
            />
          </Panel>
        </section>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-4xl bg-[#201914] p-6 text-[#fff8eb] shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#df9a35]">Summary</p>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[#dfd2bd]">Order type</span>
                <span className="font-bold capitalize">{orderType.replace("-", " ")}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#dfd2bd]">Items</span>
                <span className="font-bold">{orderItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
            </div>
            <div className="mt-8 border-t border-[#5c4b3c] pt-6">
              <p className="text-sm text-[#dfd2bd]">Estimated total</p>
              <p className="mt-1 text-4xl font-black text-[#df9a35]">
                {formatEtbFromCents(subtotalCents)}
              </p>
              <p className="mt-3 text-xs leading-6 text-[#bbaa93]">
                Final pricing is confirmed by order-service when the order is placed.
              </p>
            </div>

            {submitError ? (
              <Alert variant="destructive" className="mt-5">
                <AlertTitle>Order error</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            ) : null}
            {lastOrderNo ? (
              <p className="mt-5 rounded-2xl bg-[#0b3b2d] px-4 py-3 text-sm font-bold">
                Order placed: <span className="font-mono">{lastOrderNo}</span>
              </p>
            ) : null}

            <Button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={() => void handlePlaceOrder()}
              className="mt-6 h-13 w-full rounded-full bg-[#df9a35] text-base font-black text-[#201914] hover:bg-[#c98222]"
            >
              {submitting ? "Placing order..." : "Place order"}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-4xl border border-[#d8c19e] bg-[#fff8eb] p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="mawa-display text-4xl leading-none text-[#0b3b2d]">{title}</h2>
        {actionLabel && onAction ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onAction}
            className="rounded-full text-[#a16d22] hover:bg-[#f3ebdc]"
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Stepper({
  value,
  onMinus,
  onPlus,
}: {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center rounded-full border border-[#d8c19e] bg-[#fff8eb] p-1">
      <button
        type="button"
        onClick={onMinus}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#0b3b2d] hover:bg-[#eadbc6]"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="w-9 text-center text-sm font-black">{value}</span>
      <button
        type="button"
        onClick={onPlus}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#df9a35] text-[#201914] hover:bg-[#c98222]"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
