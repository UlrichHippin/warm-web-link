import { MessageCircle } from "lucide-react";
import { createWhatsAppUrl } from "@/lib/booking";

interface Props {
  message?: string;
  label?: string;
  selectedService?: string | null;
}

export function StickyWhatsAppBar({
  message,
  label = "Book via WhatsApp",
  selectedService,
}: Props) {
  const finalMessage =
    message ??
    (selectedService
      ? `Hello FreshDream, I would like to book the "${selectedService}" service in Nairobi.`
      : "Hello FreshDream, I would like to book a mattress refresh in Nairobi.");
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
    <div className="mx-auto max-w-3xl space-y-1 px-4 py-3">
        {selectedService ? (
          <p className="text-center text-xs text-muted-foreground">
            Selected: <span className="font-semibold text-foreground">{selectedService}</span>
          </p>
        ) : null}
        <a
          href={createWhatsAppUrl(finalMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-colors hover:bg-primary/90 active:scale-[0.99]"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
          {label}
        </a>
    </div>
  );
}
