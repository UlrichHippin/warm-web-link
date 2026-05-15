import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { fmtKES, waLink, WHATSAPP_NUMBER } from "@/lib/booking";

export const Route = createFileRoute("/thank-you/$requestId")({
  component: ThankYou,
});

interface BookingRow {
  request_id: string;
  full_name: string;
  whatsapp_number: string;
  email: string;
  cleaning_package: string;
  mattress_size: string;
  number_of_mattresses: number;
  addons: string[] | null;
  area_zone: string;
  exact_address: string;
  preferred_date: string;
  preferred_time_window: string;
  estimated_total: number | null;
}

function ThankYou() {
  const { requestId } = Route.useParams();
  // Public RLS forbids reading bookings, so we render only what we know:
  // request_id from the URL, plus a localStorage cache (set on submit) if present.
  // For a robust approach we re-render with whatever Supabase returns to admins;
  // for the public page the URL request_id is the source of truth.
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    // 1) Best-effort fetch from Supabase (no-op for public users due to RLS).
    // 2) Fallback: read the sessionStorage cache written on submit.
    (async () => {
      const { data } = await supabase
        .from("booking_requests")
        .select(
          "request_id,full_name,whatsapp_number,email,cleaning_package,mattress_size,number_of_mattresses,addons,area_zone,exact_address,preferred_date,preferred_time_window,estimated_total",
        )
        .eq("request_id", requestId)
        .maybeSingle();
      if (data) {
        setBooking(data as BookingRow);
      } else {
        try {
          const cached = sessionStorage.getItem(`fd-booking-${requestId}`);
          if (cached) setBooking(JSON.parse(cached) as BookingRow);
        } catch {
          // ignore
        }
      }
      setTried(true);
    })();
  }, [requestId]);

  const message = buildCustomerMessage({ requestId, booking });
  const wa = waLink(WHATSAPP_NUMBER, message);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-accent/15 to-background">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl">Booking Request Received ✅</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {booking?.full_name && (
              <p className="text-base">
                Thank you, <span className="font-semibold">{booking.full_name}</span>.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Your FreshDream Booking Request has been received.
            </p>
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Request ID</p>
              <p className="text-2xl font-bold tracking-wider text-primary">{requestId}</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Please keep this Request ID. FreshDream uses it to confirm your
              appointment, check availability, update your request and manage your
              cleaning job properly.
            </p>
            <div className="rounded-lg border border-accent/40 bg-accent/15 p-3 text-left text-xs leading-relaxed">
              <strong>This is not a confirmed appointment yet.</strong> FreshDream
              will confirm final availability, final price and official M-PESA
              payment instructions via WhatsApp.
            </div>
            {/* I6: make it explicit that WhatsApp is the main channel and
                email is only a backup. */}
            <p className="text-xs leading-relaxed text-muted-foreground">
              FreshDream contacts customers on WhatsApp only. Your email is kept
              as a backup in case we cannot reach you on WhatsApp.
            </p>
          </CardContent>
        </Card>

        {booking && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1.5 text-sm">
                <Row k="Request ID" v={booking.request_id} />
                <Row k="Name" v={booking.full_name} />
                <Row k="WhatsApp" v={booking.whatsapp_number} />
                <Row k="Email" v={booking.email} />
                <Row k="Service package" v={booking.cleaning_package} />
                <Row k="Mattress size" v={booking.mattress_size} />
                <Row k="Number of mattresses" v={booking.number_of_mattresses} />
                <Row k="Add-ons" v={(booking.addons ?? []).join(", ") || "—"} />
                <Row k="Location zone" v={booking.area_zone} />
                <Row k="Exact address" v={booking.exact_address} />
                <Row k="Preferred date" v={booking.preferred_date} />
                <Row k="Preferred time" v={booking.preferred_time_window} />
                <Separator className="my-2" />
                <Row k="Estimated total" v={fmtKES(booking.estimated_total)} bold />
              </dl>
            </CardContent>
          </Card>
        )}

        <a href={wa} target="_blank" rel="noopener noreferrer" className="mt-6 block">
          <Button size="lg" className="w-full rounded-2xl">
            <MessageCircle className="mr-2 h-5 w-5" />
            Send Request ID on WhatsApp
          </Button>
        </a>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            Submit another booking
          </Link>
        </div>

        {!tried && (
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading summary…
          </p>
        )}
      </main>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string | number | null; bold?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={`col-span-2 break-words ${bold ? "text-base font-bold text-primary" : "font-medium"}`}>
        {v ?? "—"}
      </dd>
    </div>
  );
}

function buildCustomerMessage({
  requestId,
  booking,
}: {
  requestId: string;
  booking: BookingRow | null;
}) {
  const b = booking;
  return [
    "Hello FreshDream, I have submitted a booking request.",
    "",
    `Request ID: ${requestId}`,
    b ? `Name: ${b.full_name}` : "",
    b ? `WhatsApp: ${b.whatsapp_number}` : "",
    b ? `Email: ${b.email}` : "",
    b ? `Service: ${b.cleaning_package}` : "",
    b ? `Mattress Size: ${b.mattress_size}` : "",
    b ? `Number of Mattresses: ${b.number_of_mattresses}` : "",
    b ? `Add-ons: ${(b.addons ?? []).join(", ") || "None"}` : "",
    b ? `Location Zone: ${b.area_zone}` : "",
    b ? `Exact Address: ${b.exact_address}` : "",
    b ? `Preferred Date: ${b.preferred_date}` : "",
    b ? `Preferred Time: ${b.preferred_time_window}` : "",
    b?.estimated_total != null ? `Estimated Total: ${fmtKES(b.estimated_total)}` : "",
    "",
    "Please confirm availability, final price and M-PESA payment instructions.",
  ]
    .filter(Boolean)
    .join("\n");
}
