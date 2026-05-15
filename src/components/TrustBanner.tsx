import { Wind, Leaf, BadgeCheck } from "lucide-react";

const items = [
  { Icon: Wind, label: "No Drying Time" },
  { Icon: Leaf, label: "Safe & Non-Toxic" },
  { Icon: BadgeCheck, label: "Certified Team" },
];

export function TrustBanner() {
  return (
    <section
      aria-label="Trust signals"
      className="mx-auto max-w-3xl px-4 py-4"
    >
      <div className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ Icon, label }) => (
          <div
            key={label}
            className="flex shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-foreground"
          >
            <Icon className="h-4 w-4 text-[color:var(--brand-lime)]" strokeWidth={2.5} />
            <span className="whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
