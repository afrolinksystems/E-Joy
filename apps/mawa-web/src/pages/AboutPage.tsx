import { Coffee, Leaf, MapPin, Star } from "lucide-react";
import { mawaFacts, photoLibrary } from "@/data/mawa-content";

const values = [
  {
    title: "Roasted with attention",
    copy: "Mawa's mood is rooted in careful coffee: warm, green, simple, and made for daily rituals.",
    icon: Coffee,
  },
  {
    title: "A calm Addis room",
    copy: "A cafe experience that feels useful in the morning, relaxed in the afternoon, and welcoming at night.",
    icon: Leaf,
  },
  {
    title: "Designed for modern ordering",
    copy: "The physical table and the digital order flow work together so guests can stay in the moment.",
    icon: MapPin,
  },
];

export function AboutPage() {
  return (
    <div className="bg-[#f3ebdc]">
      <section className="mawa-container grid gap-10 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-[#a16d22]">
            About Mawa
          </p>
          <h1 className="mawa-display mt-4 text-6xl leading-none text-[#0b3b2d] sm:text-7xl lg:text-8xl">
            A coffee house with a roastery heart.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f564d]">
            Mawa Coffee and Roastery is built around the feeling of a good table: rich coffee,
            warm wood, quiet service, and a brand language that belongs to Addis Ababa.
          </p>
        </div>
        <div className="mawa-photo aspect-4/5 rounded-4xl">
          <img src={photoLibrary.roaster} alt="Coffee roasting at Mawa" />
        </div>
      </section>

      <section className="bg-[#0b3b2d] py-16 text-[#fff8eb] lg:py-24">
        <div className="mawa-container grid gap-6 lg:grid-cols-3">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <article key={value.title} className="rounded-4xl border border-[#fff8eb]/15 bg-[#fff8eb]/10 p-6">
                <Icon className="text-[#df9a35]" size={34} />
                <h2 className="mt-8 text-2xl font-bold">{value.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[#eadbc6]">{value.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mawa-container grid gap-8 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-24">
        <div className="rounded-4xl bg-[#fff8eb] p-8 shadow-sm">
          <div className="flex gap-1 text-[#df9a35]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={18} fill="currentColor" />
            ))}
          </div>
          <p className="mt-5 text-6xl font-black text-[#0b3b2d]">{mawaFacts.rating}</p>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-[#a16d22]">
            {mawaFacts.reviewCount} Google reviews
          </p>
          <p className="mt-6 leading-8 text-[#5f564d]">
            A young cafe with a strong first signal: guests are already rating the room, service,
            and coffee highly.
          </p>
        </div>
        <div className="mawa-photo aspect-16/10 rounded-4xl">
          <img src={photoLibrary.table} alt="Mawa cafe seating" />
        </div>
      </section>
    </div>
  );
}
