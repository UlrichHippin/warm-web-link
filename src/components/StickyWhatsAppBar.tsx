import { useEffect, useRef, useState } from "react";
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

  const [open, setOpen] = useState(false);
  const isTouchRef = useRef(false);
  const suppressClickRef = useRef(false);
  const anchorRef = useRef<HTMLAnchorElement>(null);

  // Close on outside tap when opened via touch
  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointer);
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, [open]);

  const handlePointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      isTouchRef.current = true;
      // Toggle tooltip; suppress the navigation click on first tap when opening
      if (!open) {
        e.preventDefault();
        suppressClickRef.current = true;
        setOpen(true);
      } else {
        suppressClickRef.current = false;
        setOpen(false);
      }
    } else {
      isTouchRef.current = false;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      suppressClickRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      setOpen((prev) => !prev);
    } else if (e.key === "Escape") {
      if (open) {
        e.stopPropagation();
        setOpen(false);
      }
    } else if (e.key === "Enter") {
      // Link wird nativ aktiviert; Tooltip vorher schließen, damit aria-expanded korrekt ist
      setOpen(false);
    }
  };

  const tooltipId = "whatsapp-fab-tooltip";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <a
            ref={anchorRef}
            href={createWhatsAppUrl(finalMessage)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            aria-expanded={open}
            aria-controls={open ? tooltipId : undefined}
            aria-describedby={open ? tooltipId : undefined}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => {
              if (!isTouchRef.current) setOpen(true);
            }}
            onMouseLeave={() => {
              if (!isTouchRef.current) setOpen(false);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_-6px_rgb(15_23_42/0.25)] transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={{ marginBottom: "env(safe-area-inset-bottom)" }}
          >
            <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
          </a>
        </TooltipTrigger>
        <TooltipContent id={tooltipId} role="tooltip" side="left" sideOffset={8}>
          <p className="font-semibold">WhatsApp öffnen</p>
          {selectedService ? (
            <p className="mt-0.5 text-xs opacity-80">Service: {selectedService}</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
