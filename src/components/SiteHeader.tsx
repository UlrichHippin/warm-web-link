import { Leaf, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="bg-transparent">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 px-4 pt-6 pb-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
        >
          <Leaf className="h-6 w-6 text-primary" strokeWidth={2.5} />
          FreshDream
        </Link>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--brand-blue)]">
          <MapPin className="h-3 w-3" />
          Nairobi
        </span>
      </div>
    </header>
  );
}
