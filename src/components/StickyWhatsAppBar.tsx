import { MessageCircle } from "lucide-react";
import { createWhatsAppUrl } from "@/lib/booking";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href={createWhatsAppUrl(finalMessage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-6px_rgb(15_23_42/0.25)] transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
          </a>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          <p className="font-semibold">WhatsApp öffnen</p>
          {selectedService ? (
            <p className="mt-0.5 text-xs opacity-80">Service: {selectedService}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
