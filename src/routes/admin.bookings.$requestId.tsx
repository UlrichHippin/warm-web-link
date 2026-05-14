import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import {
  APPOINTMENT_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  STATUS_OPTIONS,
  fmtKES,
  waLink,
} from "@/lib/booking";
import { RequireAdmin } from "./admin";

export const Route = createFileRoute("/admin/bookings/$requestId")({
  component: () => (
    <RequireAdmin>
      <BookingDetail />
    </RequireAdmin>
  ),
});

interface FullBooking {
  id: string;
  request_id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  whatsapp_number: string;
  email: string;
  property_type: string | null;
  exact_address: string;
  area_zone: string;
  cleaning_package: string;
  mattress_size: string;
  number_of_mattresses: number;
  addons: string[] | null;
  special_notes: string | null;
  preferred_date: string;
  preferred_time_window: string;
  upload_photo_url: string | null;
  mattress_price: number | null;
  location_fee: number | null;
  addons_price: number | null;
  estimated_total: number | null;
  status: string;
  payment_status: string;
  appointment_status: string;
  internal_notes: string | null;
  admin_last_updated_at: string | null;
}

function BookingDetail() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["booking", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();
      if (error) throw error;
      return data as FullBooking | null;
    },
  });

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">Booking not found.</p>
          <Button variant="outline" onClick={() => navigate({ to: "/admin" })}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <DetailView booking={data} onSaved={() => qc.invalidateQueries({ queryKey: ["booking", requestId] })} />;
}

function DetailView({ booking, onSaved }: { booking: FullBooking; onSaved: () => void }) {
  const [status, setStatus] = useState(booking.status);
  const [paymentStatus, setPaymentStatus] = useState(booking.payment_status);
  const [appointmentStatus, setAppointmentStatus] = useState(booking.appointment_status);
  const [notes, setNotes] = useState(booking.internal_notes ?? "");
  const [finalPrice, setFinalPrice] = useState<string>(
    booking.estimated_total ? String(booking.estimated_total) : "",
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("booking_requests")
      .update({
        status,
        payment_status: paymentStatus,
        appointment_status: appointmentStatus,
        internal_notes: notes || null,
        admin_last_updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);
    setSaving(false);
    if (error) {
      toast.error("Save failed", { description: error.message });
      return;
    }
    toast.success("Saved");
    onSaved();
  };

  const msg = (text: string) => waLink(booking.whatsapp_number, text);

  const initialMsg = `Hello ${booking.full_name}, this is FreshDream Mattress Care.

We received your booking request.

Request ID: ${booking.request_id}

Service: ${booking.cleaning_package}
Preferred Date: ${booking.preferred_date}
Preferred Time: ${booking.preferred_time_window}
Estimated Total: ${fmtKES(booking.estimated_total)}

Please confirm if these details are correct so we can confirm availability, final price and M-PESA payment instructions.`;

  const confirmMsg = `Hello ${booking.full_name}, your FreshDream booking has been confirmed.

Request ID: ${booking.request_id}

Service: ${booking.cleaning_package}
Date: ${booking.preferred_date}
Time: ${booking.preferred_time_window}

FreshDream will share final price and official M-PESA payment instructions here.

Thank you for choosing FreshDream Mattress Care.`;

  const paymentMsg = `Hello ${booking.full_name}, your FreshDream booking has been reviewed.

Request ID: ${booking.request_id}

Final confirmed price: KES ${Number(finalPrice || 0).toLocaleString("en-KE")}

Please wait for official M-PESA payment instructions from FreshDream before sending payment.`;

  const completedMsg = `Hello ${booking.full_name}, your FreshDream mattress refresh has been completed.

Request ID: ${booking.request_id}

Thank you for choosing FreshDream Mattress Care. We would appreciate your feedback.`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <p className="font-mono text-sm text-muted-foreground">{booking.request_id}</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Row k="Customer" v={booking.full_name} />
                <Row k="WhatsApp" v={booking.whatsapp_number} />
                <Row k="Email" v={booking.email} />
                <Row k="Property type" v={booking.property_type ?? "—"} />
                <Row k="Area / Zone" v={booking.area_zone} full />
                <Row k="Address" v={booking.exact_address} full />
                <Row k="Package" v={booking.cleaning_package} full />
                <Row k="Mattress size" v={booking.mattress_size} />
                <Row k="Number" v={booking.number_of_mattresses} />
                <Row k="Add-ons" v={(booking.addons ?? []).join(", ") || "—"} full />
                <Row k="Special notes" v={booking.special_notes ?? "—"} full />
                <Row k="Preferred date" v={booking.preferred_date} />
                <Row k="Preferred time" v={booking.preferred_time_window} />
                <Separator className="sm:col-span-2" />
                <Row k="Mattress price" v={fmtKES(booking.mattress_price)} />
                <Row k="Location fee" v={fmtKES(booking.location_fee)} />
                <Row k="Add-ons price" v={fmtKES(booking.addons_price)} />
                <Row k="Estimated total" v={fmtKES(booking.estimated_total)} bold />
                {booking.upload_photo_url && (
                  <div className="sm:col-span-2">
                    <p className="mb-2 text-xs text-muted-foreground">Photo</p>
                    <a
                      href={booking.upload_photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Open photo
                    </a>
                    <img
                      src={booking.upload_photo_url}
                      alt="Mattress photo"
                      className="mt-2 max-h-72 rounded-md border"
                    />
                  </div>
                )}
                <Row
                  k="Submitted"
                  v={new Date(booking.created_at).toLocaleString("en-KE")}
                  full
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WhatsApp quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <WaButton href={msg(initialMsg)} label="1 · Contact customer" />
              <WaButton href={msg(confirmMsg)} label="2 · Confirm booking" />
              <div className="space-y-2 sm:col-span-2 rounded-md border p-3">
                <Label htmlFor="finalPrice" className="text-xs">
                  3 · Request payment — set final confirmed price (KES)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="finalPrice"
                    type="number"
                    min={0}
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    className="max-w-[10rem]"
                  />
                  <a href={msg(paymentMsg)} target="_blank" rel="noreferrer" className="flex-1">
                    <Button className="w-full bg-[#25D366] hover:bg-[#25D366]/90">
                      <MessageCircle className="mr-2 h-4 w-4" /> Send payment message
                    </Button>
                  </a>
                </div>
              </div>
              <WaButton href={msg(completedMsg)} label="4 · Mark completed message" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldSel label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
              <FieldSel
                label="Payment status"
                value={paymentStatus}
                onChange={setPaymentStatus}
                options={PAYMENT_STATUS_OPTIONS}
              />
              <FieldSel
                label="Appointment status"
                value={appointmentStatus}
                onChange={setAppointmentStatus}
                options={APPOINTMENT_STATUS_OPTIONS}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Internal notes</Label>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <Button className="w-full" onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
              {booking.admin_last_updated_at && (
                <p className="text-[10px] text-muted-foreground">
                  Last updated {new Date(booking.admin_last_updated_at).toLocaleString("en-KE")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function FieldSel({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function WaButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      <Button variant="outline" className="w-full justify-start">
        <MessageCircle className="mr-2 h-4 w-4 text-[#25D366]" /> {label}
      </Button>
    </a>
  );
}

function Row({
  k,
  v,
  bold,
  full,
}: {
  k: string;
  v: string | number | null;
  bold?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs text-muted-foreground">{k}</p>
      <p className={`break-words ${bold ? "text-base font-bold text-primary" : "font-medium"}`}>
        {v ?? "—"}
      </p>
    </div>
  );
}
