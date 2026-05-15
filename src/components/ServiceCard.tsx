import { Check, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  Icon: LucideIcon;
  title: string;
  description: string;
  priceHint: string;
  selected?: boolean;
  onSelect: () => void;
}

export function ServiceCard({
  Icon,
  title,
  description,
  priceHint,
  selected = false,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl bg-card p-6 text-left transition-all",
        "shadow-[0_4px_16px_-6px_rgb(15_23_42/0.08)] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgb(15_23_42/0.14)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        selected &&
          "ring-2 ring-primary shadow-[0_8px_24px_-10px_color-mix(in_oklab,var(--brand-lime)_45%,transparent)]",
      )}
    >
      <Icon
        className="h-6 w-6 shrink-0 text-[#1E4B35]"
        strokeWidth={2}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <p className="text-base font-bold leading-tight text-[#1E4B35]">
          <span>{title}</span>
          <span className="text-[#1E4B35]/70"> · {priceHint}</span>
        </p>
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
          {description}
        </p>
      </div>

      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-primary/40 bg-transparent group-hover:border-primary",
        )}
        aria-hidden="true"
      >
        {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
      </span>
    </button>
  );
}
