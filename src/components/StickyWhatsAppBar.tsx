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
    <a
      href={createWhatsAppUrl(finalMessage)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={selectedService ? `${label} – ${selectedService}` : label}
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-6px_rgb(15_23_42/0.25)] transition-transform hover:scale-105 active:scale-95"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
    </a>
  );
}
