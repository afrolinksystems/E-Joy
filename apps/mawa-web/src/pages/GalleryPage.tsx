import { useMemo, useState } from "react";
import { galleryItems } from "@/data/mawa-content";

export function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(galleryItems.map((item) => item.category)))];
  const filtered = useMemo(
    () =>
      selectedCategory === "All"
        ? galleryItems
        : galleryItems.filter((item) => item.category === selectedCategory),
    [selectedCategory],
  );

  return (
    <div className="bg-[#f3ebdc] pb-16">
      <section className="mawa-container py-16 lg:py-24">
        <div className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-[#a16d22]">Gallery</p>
          <h1 className="mawa-display mt-4 text-6xl leading-none text-[#0b3b2d] sm:text-7xl lg:text-8xl">
            The room, the roast, the ritual.
          </h1>
        </div>

        <div className="mawa-no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={[
                "min-w-max rounded-full px-5 py-3 text-sm font-bold transition",
                selectedCategory === category
                  ? "bg-[#0b3b2d] text-[#fff8eb]"
                  : "border border-[#d8c19e] bg-[#fff8eb] text-[#0b3b2d] hover:bg-[#eadbc6]",
              ].join(" ")}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="mawa-wide grid auto-rows-[16rem] grid-cols-1 gap-3 px-2 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((item, index) => (
          <article
            key={item.title}
            className={[
              "mawa-photo group relative overflow-hidden rounded-[1.6rem]",
              index % 5 === 0 ? "lg:col-span-2 lg:row-span-2" : "",
              index % 7 === 0 ? "sm:row-span-2" : "",
            ].join(" ")}
          >
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b3b2d]/82 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-[#fff8eb]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#df9a35]">
                {item.category}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{item.title}</h2>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
