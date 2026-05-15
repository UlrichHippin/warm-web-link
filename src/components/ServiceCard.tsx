import { ChevronRight, type LucideIcon } from "lucide-react";

interface Props {
  Icon: LucideIcon;
  title: string;
  description: string;
  priceHint: string;
  onSelect: () => void;
}

export function ServiceCard({ Icon, title, description, priceHint, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent">
        <Icon className="h-6 w-6 text-foreground" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
        <p className="mt-1 text-xs font-medium text-primary">{priceHint}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
