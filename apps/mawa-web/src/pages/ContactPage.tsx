import { useState, type ReactNode } from "react";
import { Clock3, Instagram, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mawaFacts, photoLibrary } from "@/data/mawa-content";

export function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="bg-[#f3ebdc]">
      <section className="mawa-container grid gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.26em] text-[#a16d22]">Contact</p>
          <h1 className="mawa-display mt-4 text-6xl leading-none text-[#0b3b2d] sm:text-7xl lg:text-8xl">
            Find the table, then stay for the cup.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f564d]">
            Visit Mawa on Africa Avenue, call ahead, or send a quick note for events, groups, or
            cafe questions.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <ContactTile icon={<MapPin size={20} />} title="Address" value={mawaFacts.address} />
            <ContactTile icon={<Clock3 size={20} />} title="Hours" value={mawaFacts.hours} />
            <ContactTile icon={<Phone size={20} />} title="Phone" value={mawaFacts.phone} />
            <ContactTile icon={<Instagram size={20} />} title="Instagram" value={mawaFacts.instagram} />
          </div>
        </div>

        <div className="mawa-photo aspect-4/5 rounded-4xl">
          <img src={photoLibrary.bar} alt="Mawa cafe bar" />
        </div>
      </section>

      <section className="bg-[#0b3b2d] py-16 text-[#fff8eb] lg:py-24">
        <div className="mawa-container grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="mawa-display text-5xl leading-none sm:text-6xl">
              Message the cafe.
            </h2>
            <p className="mt-5 max-w-md leading-8 text-[#eadbc6]">
              The form is local for now, but the interaction is ready for a future contact API or
              reservation request flow.
            </p>
          </div>
          <form
            className="rounded-4xl border border-[#fff8eb]/15 bg-[#fff8eb] p-5 text-[#201914] sm:p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              setName("");
              setEmail("");
              setMessage("");
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
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
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl border-[#d8c19e] bg-[#fff8eb]"
                placeholder="Email address"
                autoComplete="email"
              />
            </div>
            <Textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-4 min-h-36 rounded-2xl border-[#d8c19e] bg-[#fff8eb]"
              placeholder="What would you like to ask?"
            />
            {sent ? (
              <p className="mt-4 rounded-2xl bg-[#e7dac5] px-4 py-3 text-sm font-bold text-[#0b3b2d]">
                Thank you. Your message is ready for the future contact workflow.
              </p>
            ) : null}
            <Button
              type="submit"
              className="mt-5 h-12 rounded-full bg-[#df9a35] px-7 text-[#201914] hover:bg-[#c98222]"
            >
              Send Message
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}

function ContactTile({ icon, title, value }: { icon: ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#d8c19e] bg-[#fff8eb] p-4">
      <div className="text-[#df9a35]">{icon}</div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#a16d22]">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#0b3b2d]">{value}</p>
    </div>
  );
}
