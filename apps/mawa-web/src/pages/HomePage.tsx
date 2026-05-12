import { useRef, type ReactNode } from "react";
import { ArrowUpRight, Clock3, MapPin, QrCode, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NavigateFn } from "@/pages/types";
import { useMawaScrollAnimations } from "@/hooks/use-mawa-scroll-animations";
import {
  cafePromises,
  mawaFacts,
  photoLibrary,
  reviews,
  signatureMenu,
} from "@/data/mawa-content";

type Props = { navigate: NavigateFn };

export function HomePage({ navigate }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  useMawaScrollAnimations(rootRef);

  return (
    <div ref={rootRef} className="overflow-hidden">
      <section className="relative min-h-[calc(100vh-4.5rem)] bg-[#0b3b2d] text-[#fff8eb]">
        <div className="absolute inset-0">
          <img
            src={photoLibrary.hero}
            alt="Warm cafe table at Mawa"
            className="gsap-parallax h-[110%] w-full object-cover opacity-45"
          />
          <div className="mawa-pattern absolute inset-0 opacity-[0.08]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(223,154,53,0.28),transparent_24rem),linear-gradient(90deg,rgba(6,39,31,0.96),rgba(6,39,31,0.75),rgba(6,39,31,0.42))]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#0b3b2d] to-transparent" />
        </div>

        <div className="mawa-container relative z-10 grid min-h-[calc(100vh-4.5rem)] items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="w-full max-w-[calc(100vw-2rem)] lg:max-w-3xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#df9a35] sm:text-sm">
              {mawaFacts.localName}
            </p>
            <h1 className="mawa-display max-w-[8.5ch] text-[clamp(2.85rem,12vw,5rem)] leading-[0.92] text-[#fff8eb] sm:max-w-none sm:text-7xl lg:text-8xl xl:text-9xl">
              Coffee that makes the room slow down.
            </h1>
            <p className="mt-6 max-w-88 text-base leading-8 text-[#eadbc6] sm:max-w-xl sm:text-lg">
              Mawa Coffee and Roastery brings fresh roast, warm interiors, and effortless ordering
              to Africa Avenue in Addis Ababa.
            </p>
            <div className="mt-8 flex max-w-[calc(100vw-2rem)] flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => navigate("/menu")}
                className="gsap-cta h-13 rounded-full bg-[#df9a35] px-7 text-base font-bold text-[#201914] hover:bg-[#c98222]"
              >
                View Menu
                <ArrowUpRight size={18} />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/order")}
                className="h-13 rounded-full border-[#fff8eb]/55 bg-[#fff8eb]/10 px-7 text-base font-bold text-[#fff8eb] backdrop-blur hover:bg-[#fff8eb] hover:text-[#0b3b2d]"
              >
                Order Online
              </Button>
            </div>
          </div>

          <aside className="gsap-reveal hidden justify-self-end rounded-4xl border border-[#fff8eb]/25 bg-[#fff8eb]/13 p-4 shadow-2xl backdrop-blur-md sm:p-5 lg:block">
            <div className="mawa-photo gsap-clip aspect-4/5 w-full max-w-md rounded-[1.45rem]">
              <img src={photoLibrary.pour} alt="Coffee being poured" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ProofTile icon={<Star size={17} />} value={mawaFacts.rating} label={`${mawaFacts.reviewCount} reviews`} />
              <ProofTile icon={<Clock3 size={17} />} value="Open" label={mawaFacts.hours} />
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-[#0b3b2d] px-2 pb-3 text-[#fff8eb]">
        <div className="mawa-pattern overflow-hidden rounded-4xl bg-[#fff8eb] text-[#0b3b2d]">
          <div className="mawa-container grid gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:py-24">
            <div className="gsap-reveal">
              <h2 className="mawa-display text-5xl leading-none sm:text-6xl lg:text-7xl">
                A roastery with a table waiting.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#5f564d]">
                The brand is calm, green, and warm: coffee roasted with care, a room made for
                lingering, and ordering that stays out of the guest's way.
              </p>
            </div>
            <div className="gsap-stagger grid gap-3 sm:grid-cols-2">
              {cafePromises.map((item) => (
                <div key={item} className="rounded-3xl border border-[#d8c19e] bg-[#fff8eb]/82 p-5 shadow-sm">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#a16d22]">Mawa</p>
                  <p className="mt-3 text-xl font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f3ebdc] py-16 lg:py-24">
        <div className="mawa-container grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-4xl bg-[#df9a35] p-5 text-[#201914] lg:p-7">
            <div className="flex items-center justify-between">
              <h2 className="mawa-display text-5xl leading-none">Signature</h2>
              <span className="rounded-full border border-[#201914]/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
                Menu
              </span>
            </div>
            <div className="mt-8 divide-y divide-[#201914]/28">
              {signatureMenu.map((item) => (
                <div key={item.name} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto]">
                  <div>
                    <h3 className="text-lg font-bold">{item.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#4c3821]">{item.detail}</p>
                  </div>
                  <p className="font-bold">{item.price}</p>
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => navigate("/menu")}
              className="mt-5 h-12 w-full rounded-full bg-[#201914] text-[#fff8eb] hover:bg-[#0b3b2d]"
            >
              Explore Full Menu
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="mawa-photo gsap-clip aspect-16/10 rounded-4xl">
              <img src={photoLibrary.latte} alt="Mawa latte" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="mawa-photo gsap-clip aspect-4/3 rounded-4xl">
                <img src={photoLibrary.pastries} alt="Fresh pastry" />
              </div>
              <div className="mawa-photo gsap-clip aspect-4/3 rounded-4xl">
                <img src={photoLibrary.beans} alt="Roasted coffee beans" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0b3b2d] py-16 text-[#fff8eb] lg:py-24">
        <div className="mawa-container grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="gsap-reveal">
            <QrCode className="mb-5 text-[#df9a35]" size={38} />
            <h2 className="mawa-display text-5xl leading-none sm:text-6xl lg:text-7xl">
              Scan, order, and keep talking.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#eadbc6]">
              The website sells the experience. The E-Joy table QR flow handles the rush: guests
              scan, see the right cafe menu, pay, and the kitchen gets the order.
            </p>
            <Button
              type="button"
              onClick={() => navigate("/order")}
              className="mt-8 h-12 rounded-full bg-[#df9a35] px-7 text-[#201914] hover:bg-[#c98222]"
            >
              Try Web Ordering
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="mawa-photo gsap-clip aspect-4/5 rounded-4xl sm:translate-y-8">
              <img src={photoLibrary.table} alt="Mawa dining room" />
            </div>
            <div className="rounded-4xl border border-[#fff8eb]/18 bg-[#fff8eb]/10 p-6 backdrop-blur">
              <MapPin className="text-[#df9a35]" size={28} />
              <h3 className="mt-6 text-2xl font-bold">Africa Avenue</h3>
              <p className="mt-3 text-sm leading-7 text-[#eadbc6]">{mawaFacts.address}</p>
              <div className="mt-8 rounded-3xl bg-[#fff8eb] p-5 text-[#0b3b2d]">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#a16d22]">
                  Google
                </p>
                <p className="mt-2 text-5xl font-bold">{mawaFacts.rating}</p>
                <p className="mt-1 text-sm">{mawaFacts.reviewCount} reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e7dac5] py-16 lg:py-24">
        <div className="mawa-container">
          <div className="mb-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <h2 className="mawa-display max-w-2xl text-5xl leading-none sm:text-6xl">
              What people remember after the cup.
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/contact")}
              className="w-fit rounded-full border-[#0b3b2d] bg-transparent text-[#0b3b2d] hover:bg-[#0b3b2d] hover:text-[#fff8eb]"
            >
              Visit Mawa
            </Button>
          </div>
          <div className="gsap-stagger grid gap-4 lg:grid-cols-3">
            {reviews.map((review) => (
              <article key={review.quote} className="min-h-64 rounded-4xl border border-[#cab597] bg-[#fff8eb]/72 p-6">
                <div className="flex gap-1 text-[#df9a35]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="mt-6 text-xl leading-8">"{review.quote}"</p>
                <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-[#80613d]">
                  {review.author}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ProofTile({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-3xl bg-[#fff8eb] p-4 text-[#0b3b2d]">
      <div className="text-[#df9a35]">{icon}</div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#80613d]">
        {label}
      </p>
    </div>
  );
}
