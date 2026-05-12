import { useState, type ReactNode } from "react";
import { Clock3, Instagram, MapPin, Menu, Phone, X } from "lucide-react";
import type { AppPath, NavigateFn } from "@/pages/types";
import { Button } from "@/components/ui/button";
import { mawaFacts, navItems } from "@/data/mawa-content";

type Props = {
  children: ReactNode;
  currentPath: AppPath;
  navigate: NavigateFn;
};

export function SiteLayout({ children, currentPath, navigate }: Props) {
  const [open, setOpen] = useState(false);

  const go = (path: AppPath) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="mawa-shell min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-[#e4d4bd]/70 bg-[#fff8eb]/88 text-[#0b3b2d] backdrop-blur-xl">
        <div className="mawa-container flex min-h-18 items-center justify-between gap-4 py-3 lg:min-h-20">
          <button
            type="button"
            onClick={() => go("/")}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label="Go to Mawa home"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d8c19e] bg-[#0b3b2d] font-serif text-xl font-black text-[#fff8eb]">
              M
            </span>
            <span className="leading-none">
              <span className="block font-serif text-2xl tracking-tight">Mawa</span>
              <span className="mt-1 hidden text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#a16d22] sm:block">
                Coffee and Roastery
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  currentPath === item.path
                    ? "bg-[#0b3b2d] text-[#fff8eb]"
                    : "text-[#214d3f] hover:bg-[#eadbc6]",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => go("/order")}
              className="hidden rounded-full bg-[#df9a35] px-5 text-[#201914] hover:bg-[#c98222] sm:inline-flex"
            >
              Order Now
            </Button>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d8c19e] bg-[#fff8eb] text-[#0b3b2d] lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="border-t border-[#eadbc6] bg-[#fff8eb] lg:hidden">
            <div className="mawa-container grid gap-2 py-4">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => go(item.path)}
                  className={[
                    "rounded-2xl px-4 py-3 text-left text-sm font-semibold",
                    currentPath === item.path
                      ? "bg-[#0b3b2d] text-[#fff8eb]"
                      : "bg-[#f3ebdc] text-[#0b3b2d]",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
              <Button
                type="button"
                onClick={() => go("/order")}
                className="mt-1 rounded-2xl bg-[#df9a35] text-[#201914] hover:bg-[#c98222]"
              >
                Order Now
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      <main>{children}</main>

      <footer className="bg-[#201914] text-[#fff8eb]">
        <div className="mawa-container grid gap-10 py-12 md:grid-cols-[1.2fr_2fr] lg:py-16">
          <div>
            <p className="font-serif text-5xl tracking-tight text-[#df9a35] sm:text-6xl lg:text-7xl">
              MAWA
            </p>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#dfd2bd]">
              Coffee, roasting, food, and calm tables on Africa Avenue. Built for slow mornings,
              quick meetings, and the next cup.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FooterBlock title="Visit">
              <FooterLine icon={<MapPin size={16} />} text={mawaFacts.address} />
            </FooterBlock>
            <FooterBlock title="Hours">
              <FooterLine icon={<Clock3 size={16} />} text={mawaFacts.hours} />
            </FooterBlock>
            <FooterBlock title="Contact">
              <FooterLine icon={<Phone size={16} />} text={mawaFacts.phone} />
              <FooterLine icon={<Instagram size={16} />} text={mawaFacts.instagram} />
            </FooterBlock>
            <FooterBlock title="Actions">
              <button type="button" onClick={() => go("/menu")} className="block text-left text-sm hover:text-[#df9a35]">
                View Menu
              </button>
              <button type="button" onClick={() => go("/contact")} className="mt-2 block text-left text-sm hover:text-[#df9a35]">
                Find Us
              </button>
              <button type="button" onClick={() => go("/order")} className="mt-2 block text-left text-sm hover:text-[#df9a35]">
                Order Online
              </button>
            </FooterBlock>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-[#5c4b3c] pt-4">
      <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-[#df9a35]">{title}</h2>
      <div className="mt-4 space-y-3 text-[#dfd2bd]">{children}</div>
    </section>
  );
}

function FooterLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <p className="flex items-start gap-2 text-sm leading-6">
      <span className="mt-1 text-[#df9a35]">{icon}</span>
      <span>{text}</span>
    </p>
  );
}
