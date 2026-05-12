import { useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { NavigateFn } from "@/pages/types";
import { defaultShopId } from "@/lib/apollo-client";
import { SHOP_MENU, type ShopMenuProduct } from "@/graphql/shop-menu";
import { formatEtbFromCents } from "@/lib/format-etb";
import { addLine } from "@/lib/mawa-cart";
import { useMawaScrollAnimations } from "@/hooks/use-mawa-scroll-animations";
import { menuFallbackImages, photoLibrary } from "@/data/mawa-content";

type Props = { navigate: NavigateFn };

export function MenuPage({ navigate }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useMawaScrollAnimations(rootRef);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { data, loading, error } = useQuery<{ shopMenu: ShopMenuProduct[] }>(SHOP_MENU, {
    variables: { shopId: defaultShopId },
  });

  const categories = useMemo(() => {
    const rows = data?.shopMenu ?? [];
    return ["All", ...Array.from(new Set(rows.map((p) => p.category).filter(Boolean)))];
  }, [data?.shopMenu]);

  const filteredItems = useMemo(() => {
    const rows = data?.shopMenu ?? [];
    return selectedCategory === "All"
      ? rows
      : rows.filter((p) => p.category === selectedCategory);
  }, [data?.shopMenu, selectedCategory]);

  return (
    <div ref={rootRef} className="bg-[#f3ebdc] pb-16">
      <section className="relative overflow-hidden bg-[#0b3b2d] py-16 text-[#fff8eb] lg:py-24">
        <img
          src={photoLibrary.beans}
          alt="Roasted beans"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-[#0b3b2d]/78" />
        <div className="mawa-container relative">
          <h1 className="gsap-reveal mawa-display max-w-4xl text-6xl leading-none sm:text-7xl lg:text-8xl">
            Menu made for morning and meeting.
          </h1>
          <p className="gsap-reveal mt-5 max-w-2xl text-base leading-8 text-[#eadbc6]">
            Live availability comes from the ordering system, styled for guests browsing before
            they arrive or adding a quick pickup order.
          </p>
        </div>
      </section>

      <div className="mawa-container py-10 lg:py-14">
        {loading ? (
          <MenuSkeleton />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load menu</AlertTitle>
            <AlertDescription>
              {error.message}. Check that order-service is running at{" "}
              <code className="rounded bg-muted px-1">localhost:9602</code>.
            </AlertDescription>
          </Alert>
        ) : (data?.shopMenu?.length ?? 0) === 0 ? (
          <EmptyMenu />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
            <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
              <div className="rounded-4xl border border-[#d8c19e] bg-[#fff8eb] p-3 shadow-sm">
                <p className="px-3 pt-2 text-xs font-bold uppercase tracking-[0.22em] text-[#a16d22]">
                  Categories
                </p>
                <div className="mawa-no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:max-h-[calc(100vh-12rem)] lg:space-y-2 lg:overflow-y-auto">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={[
                        "min-w-max rounded-2xl px-4 py-3 text-left text-sm font-bold transition lg:block lg:w-full",
                        selectedCategory === category
                          ? "bg-[#0b3b2d] text-[#fff8eb]"
                          : "bg-[#f3ebdc] text-[#0b3b2d] hover:bg-[#eadbc6]",
                      ].join(" ")}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="grid gap-4">
              <div className="mb-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#a16d22]">
                    {selectedCategory}
                  </p>
                  <h2 className="mawa-display mt-1 text-4xl leading-none">Fresh from Mawa</h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/order")}
                  className="hidden rounded-full border-[#0b3b2d] bg-transparent text-[#0b3b2d] hover:bg-[#0b3b2d] hover:text-[#fff8eb] sm:inline-flex"
                >
                  Cart
                </Button>
              </div>

              <div className="gsap-stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map((item, index) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    image={item.imageUrl || menuFallbackImages[index % menuFallbackImages.length]}
                    onAdd={() => {
                      addLine(item.id, item.name, item.unitPrice, 1);
                    }}
                    onOrder={() => {
                      addLine(item.id, item.name, item.unitPrice, 1);
                      navigate("/order");
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function MenuCard({
  item,
  image,
  onAdd,
  onOrder,
}: {
  item: ShopMenuProduct;
  image: string;
  onAdd: () => void;
  onOrder: () => void;
}) {
  return (
    <article className="group overflow-hidden rounded-[1.8rem] border border-[#d8c19e] bg-[#fff8eb] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="mawa-photo aspect-[4/3]">
        <img src={image} alt={item.name} loading="lazy" />
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a16d22]">
          {item.category || "Mawa"}
        </p>
        <h3 className="mt-2 min-h-14 text-xl font-bold leading-tight text-[#0b3b2d]">
          {item.name}
        </h3>
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-2xl font-black text-[#201914]">{formatEtbFromCents(item.unitPrice)}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onAdd}
              className="rounded-full border-[#d8c19e] bg-transparent text-[#0b3b2d] hover:bg-[#e7dac5]"
            >
              Add
            </Button>
            <Button
              type="button"
              onClick={onOrder}
              className="rounded-full bg-[#df9a35] text-[#201914] hover:bg-[#c98222]"
            >
              Order
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MenuSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-[1.8rem] bg-[#fff8eb]" />
      ))}
    </div>
  );
}

function EmptyMenu() {
  return (
    <div className="rounded-[2rem] border border-[#d8c19e] bg-[#fff8eb] p-10 text-center">
      <h2 className="mawa-display text-4xl">The menu is resting.</h2>
      <p className="mt-3 text-[#6d6255]">No items are available in this shop yet.</p>
    </div>
  );
}
