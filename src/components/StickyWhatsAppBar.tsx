import { MessageCircle } from "lucide-react";
import { createWhatsAppUrl } from "@/lib/booking";

interface Props {
  message?: string;
  label?: string;
}

export function StickyWhatsAppBar({
  message = "Hello FreshDream, I would like to book a mattress refresh in Nairobi.",
  label = "Book via WhatsApp",
}: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-3">
        <a
          href={createWhatsAppUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary/90 active:scale-[0.99]"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
          {label}
        </a>
      </div>
    </div>
  );
}
