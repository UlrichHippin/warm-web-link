import { Leaf, Shield, Wind } from "lucide-react";

const items = [
  { Icon: Leaf, label: "Safe", desc: "Eco-friendly products" },
  { Icon: Shield, label: "Deep Clean", desc: "Hotel-grade hygiene" },
  { Icon: Wind, label: "Fresh", desc: "No drying time" },
];

export function TrustBanner() {
  return (
    <section
      aria-label="Trust signals"
      className="mx-auto grid max-w-3xl grid-cols-3 gap-3 px-4 py-6"
    >
      {items.map(({ Icon, label, desc }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center shadow-[var(--shadow-soft)]"
        >
          <div className="grid h-11 w-11 place-items-center rounded-full bg-accent">
            <Icon className="h-5 w-5 text-foreground" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <p className="text-[11px] leading-tight text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
