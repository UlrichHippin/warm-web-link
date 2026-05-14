import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

import { supabase, supabaseConfigured } from "@/integrations/supabase/client";
import {
  ADDONS,
  AREA_ZONES,
  CLEANING_PACKAGES,
  MATTRESS_SIZES,
  PROPERTY_TYPES,
  TIME_WINDOWS,
  bookingFormSchema,
  estimate,
  fmtKES,
  generateRequestId,
  createWhatsAppUrl,
  type BookingFormValues,
} from "@/lib/booking";

export const Route = createFileRoute("/")({
  component: PublicBookingPage,
});

type Step = "intro" | "form" | "review";

function PublicBookingPage() {
  const [step, setStep] = useState<Step>("intro");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">FreshDream</p>
              <p className="text-xs text-muted-foreground">Mattress Care · Nairobi</p>
            </div>
          </div>
          <a
            href={createWhatsAppUrl("Hello FreshDream, I would like to ask about a mattress refresh.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary hover:underline"
          >
            WhatsApp us
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {step === "intro" && <Intro onStart={() => setStep("form")} />}
        {step !== "intro" && (
          <BookingForm step={step} setStep={setStep} />
        )}
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FreshDream Mattress Care · Nairobi
      </footer>
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-accent/20 to-background shadow-sm">
        <CardContent className="space-y-4 p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Trusted mattress refresh in Nairobi
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Official FreshDream Booking Request
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            FreshDream Mattress Care – Nairobi
          </p>
          <p className="text-base leading-relaxed text-foreground/80">
            Book a mattress refresh in Nairobi with no drying time.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Complete this short form to submit your booking request. FreshDream
            will review your request and confirm availability, final price and
            official M-PESA payment instructions via WhatsApp.
          </p>
          <Button size="lg" className="w-full sm:w-auto" onClick={onStart}>
            Start Booking Request
          </Button>
        </CardContent>
      </Card>

      <Alert className="border-accent/40 bg-accent/15">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm leading-relaxed">
          This is a booking request, not a confirmed appointment yet. No payment
          is required now. FreshDream will confirm availability, final price and
          payment instructions via WhatsApp.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { t: "No drying time", d: "Sleep on it the same night" },
          { t: "Trained crew", d: "Professional, polite and on time" },
          { t: "Pay after confirmation", d: "Official M-PESA via WhatsApp" },
        ].map((f) => (
          <Card key={f.t}>
            <CardContent className="space-y-1 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {f.t}
              </div>
              <p className="text-xs text-muted-foreground">{f.d}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BookingForm({ step, setStep }: { step: Step; setStep: (s: Step) => void }) {
  const navigate = useNavigate();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      full_name: "",
      whatsapp_number: "",
      email: "",
      property_type: undefined as unknown as BookingFormValues["property_type"],
      exact_address: "",
      area_zone: undefined as unknown as BookingFormValues["area_zone"],
      cleaning_package: undefined as unknown as BookingFormValues["cleaning_package"],
      mattress_size: undefined as unknown as BookingFormValues["mattress_size"],
      number_of_mattresses: 1,
      addons: [],
      special_notes: "",
      preferred_date: "",
      preferred_time_window: undefined as unknown as BookingFormValues["preferred_time_window"],
      upload_photo_url: "",
      consent: undefined as unknown as true,
    },
    mode: "onTouched",
  });

  const watched = form.watch();
  const est = useMemo(
    () =>
      estimate({
        mattress_size: watched.mattress_size ?? "",
        area_zone: watched.area_zone ?? "",
        number_of_mattresses: watched.number_of_mattresses ?? 1,
        addons: watched.addons ?? [],
      }),
    [
      watched.mattress_size,
      watched.area_zone,
      watched.number_of_mattresses,
      watched.addons,
    ],
  );

  useEffect(() => {
    if (step === "review") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large", { description: "Max 10MB" });
      return;
    }
    if (!supabaseConfigured) {
      toast.error("Photo upload disabled", {
        description: "Supabase is not configured yet.",
      });
      return;
    }
    setPhotoUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("booking-photos")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("booking-photos").getPublicUrl(path);
      form.setValue("upload_photo_url", data.publicUrl, { shouldValidate: true });
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const goReview = async () => {
    const valid = await form.trigger([
      "full_name",
      "whatsapp_number",
      "email",
      "property_type",
      "exact_address",
      "area_zone",
      "cleaning_package",
      "mattress_size",
      "number_of_mattresses",
      "preferred_date",
      "preferred_time_window",
    ]);
    if (!valid) {
      toast.error("Please complete required fields");
      return;
    }
    setStep("review");
  };

  const onSubmit = async (values: BookingFormValues) => {
    if (!supabaseConfigured) {
      toast.error("Booking disabled", {
        description:
          "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then redeploy.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const requestId = generateRequestId();
      const finalEst = estimate({
        mattress_size: values.mattress_size,
        area_zone: values.area_zone,
        number_of_mattresses: values.number_of_mattresses,
        addons: values.addons,
      });
      const { error } = await supabase.from("booking_requests").insert({
        request_id: requestId,
        full_name: values.full_name,
        whatsapp_number: values.whatsapp_number,
        email: values.email,
        property_type: values.property_type,
        exact_address: values.exact_address,
        area_zone: values.area_zone,
        cleaning_package: values.cleaning_package,
        mattress_size: values.mattress_size,
        number_of_mattresses: values.number_of_mattresses,
        addons: values.addons,
        special_notes: values.special_notes || null,
        preferred_date: values.preferred_date,
        preferred_time_window: values.preferred_time_window,
        upload_photo_url: values.upload_photo_url || null,
        mattress_price: finalEst.mattress_price,
        location_fee: finalEst.location_fee,
        addons_price: finalEst.addons_price,
        estimated_total: finalEst.estimated_total,
      });
      if (error) throw error;
      // Cache for the thank-you page (public RLS forbids reading bookings).
      try {
        sessionStorage.setItem(
          `fd-booking-${requestId}`,
          JSON.stringify({
            request_id: requestId,
            full_name: values.full_name,
            whatsapp_number: values.whatsapp_number,
            email: values.email,
            cleaning_package: values.cleaning_package,
            mattress_size: values.mattress_size,
            number_of_mattresses: values.number_of_mattresses,
            addons: values.addons,
            area_zone: values.area_zone,
            exact_address: values.exact_address,
            preferred_date: values.preferred_date,
            preferred_time_window: values.preferred_time_window,
            estimated_total: finalEst.estimated_total,
          }),
        );
      } catch {
        // sessionStorage unavailable — message will use only the request_id.
      }
      navigate({ to: "/thank-you/$requestId", params: { requestId } });
    } catch (e) {
      toast.error("Could not submit booking", {
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "review") {
    return (
      <ReviewSummary
        values={watched}
        est={est}
        onBack={() => setStep("form")}
        onSubmit={form.handleSubmit(onSubmit)}
        consent={!!watched.consent}
        setConsent={(v) => form.setValue("consent", v as true, { shouldValidate: true })}
        submitting={submitting}
      />
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1 · Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Full Name" error={form.formState.errors.full_name?.message}>
            <Input {...form.register("full_name")} placeholder="Jane Wanjiku" />
          </Field>
          <Field
            label="WhatsApp Number"
            help="Please enter your WhatsApp number in international format, including country code. Examples: +254708835235 or +4915756233913."
            error={form.formState.errors.whatsapp_number?.message}
          >
            <Input
              {...form.register("whatsapp_number")}
              type="tel"
              placeholder="+254708835235 or +4915756233913"
              inputMode="tel"
            />
          </Field>
          <Field label="Email Address" error={form.formState.errors.email?.message}>
            <Input {...form.register("email")} type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Property Type" error={form.formState.errors.property_type?.message}>
            <SelectControlled
              value={watched.property_type}
              onChange={(v) =>
                form.setValue("property_type", v as BookingFormValues["property_type"], {
                  shouldValidate: true,
                })
              }
              placeholder="Select property type"
              options={PROPERTY_TYPES}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2 · Location Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Exact Address in Nairobi"
            help="Estate/building name, apartment number, road and useful directions."
            error={form.formState.errors.exact_address?.message}
          >
            <Textarea
              {...form.register("exact_address")}
              rows={3}
              placeholder="e.g., Mirema Drive, Roysambu, Apt 3B, Sunrise Heights"
            />
          </Field>
          <Field label="Area / Zone" error={form.formState.errors.area_zone?.message}>
            <SelectControlled
              value={watched.area_zone}
              onChange={(v) =>
                form.setValue("area_zone", v as BookingFormValues["area_zone"], {
                  shouldValidate: true,
                })
              }
              placeholder="Select area"
              options={AREA_ZONES}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3 · Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Cleaning Package" error={form.formState.errors.cleaning_package?.message}>
            <SelectControlled
              value={watched.cleaning_package}
              onChange={(v) =>
                form.setValue("cleaning_package", v as BookingFormValues["cleaning_package"], {
                  shouldValidate: true,
                })
              }
              placeholder="Choose package"
              options={CLEANING_PACKAGES}
            />
          </Field>
          <Field label="Mattress Size" error={form.formState.errors.mattress_size?.message}>
            <SelectControlled
              value={watched.mattress_size}
              onChange={(v) =>
                form.setValue("mattress_size", v as BookingFormValues["mattress_size"], {
                  shouldValidate: true,
                })
              }
              placeholder="Select size"
              options={MATTRESS_SIZES}
            />
          </Field>
          <Field
            label="Number of Mattresses"
            error={form.formState.errors.number_of_mattresses?.message}
          >
            <Input
              type="number"
              min={1}
              {...form.register("number_of_mattresses", { valueAsNumber: true })}
            />
          </Field>
          <Field label="Add-ons">
            <div className="grid gap-2">
              {ADDONS.map((a) => {
                const checked = (watched.addons ?? []).includes(a);
                return (
                  <label
                    key={a}
                    className="flex cursor-pointer items-start gap-2 rounded-md border p-3 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const next = new Set(watched.addons ?? []);
                        if (v) next.add(a);
                        else next.delete(a);
                        form.setValue(
                          "addons",
                          Array.from(next) as BookingFormValues["addons"],
                          { shouldValidate: true },
                        );
                      }}
                    />
                    <span className="text-sm leading-snug">{a}</span>
                  </label>
                );
              })}
            </div>
          </Field>
          <Field
            label="Special Notes / Stains"
            error={form.formState.errors.special_notes?.message}
          >
            <Textarea
              rows={3}
              {...form.register("special_notes")}
              placeholder="Tell us about stains, building access, parking, pets, timing limits or anything we should know before confirmation."
            />
          </Field>
          <Field label="Upload Photo (optional, max 10MB)">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/30 px-4 py-6 text-sm hover:bg-muted/50">
              {photoUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : watched.upload_photo_url ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Photo uploaded · tap to replace
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Tap to upload mattress / stain photo
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                hidden
                onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4 · Preferred Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Preferred Date" error={form.formState.errors.preferred_date?.message}>
            <Input type="date" min={today} {...form.register("preferred_date")} />
          </Field>
          <Field
            label="Preferred Time Window"
            error={form.formState.errors.preferred_time_window?.message}
          >
            <SelectControlled
              value={watched.preferred_time_window}
              onChange={(v) =>
                form.setValue(
                  "preferred_time_window",
                  v as BookingFormValues["preferred_time_window"],
                  { shouldValidate: true },
                )
              }
              placeholder="Pick a time window"
              options={TIME_WINDOWS}
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">5 · Estimate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-sm text-muted-foreground">Estimated Price</span>
            <span className="text-3xl font-bold text-primary">
              {fmtKES(est.estimated_total)}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            This is an estimate only. Final price will be confirmed after FreshDream
            reviews your location, mattress size, photos and requested service. No
            payment is required now.
          </p>
          {est.needsConfirmation && (
            <Alert className="border-accent/40 bg-accent/15">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your final price will be confirmed via WhatsApp after review.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Button type="button" size="lg" className="w-full" onClick={goReview}>
        Review Booking Request
      </Button>
    </form>
  );
}

function ReviewSummary({
  values,
  est,
  onBack,
  onSubmit,
  consent,
  setConsent,
  submitting,
}: {
  values: BookingFormValues;
  est: ReturnType<typeof estimate>;
  onBack: () => void;
  onSubmit: () => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  submitting: boolean;
}) {
  const rows: Array<[string, string | number | undefined]> = [
    ["Customer name", values.full_name],
    ["WhatsApp number", values.whatsapp_number],
    ["Email", values.email],
    ["Property type", values.property_type],
    ["Address", values.exact_address],
    ["Area / Zone", values.area_zone],
    ["Cleaning package", values.cleaning_package],
    ["Mattress size", values.mattress_size],
    ["Number of mattresses", values.number_of_mattresses],
    ["Add-ons", (values.addons ?? []).join(", ") || "—"],
    ["Special notes", values.special_notes || "—"],
    ["Preferred date", values.preferred_date],
    ["Preferred time", values.preferred_time_window],
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Your Booking Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Please check your details before submitting. This is still a booking
            request, not a confirmed appointment yet. FreshDream will confirm
            availability, final price and official M-PESA payment instructions via
            WhatsApp.
          </p>
          <Separator />
          <dl className="space-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-3">
                <dt className="col-span-1 text-muted-foreground">{k}</dt>
                <dd className="col-span-2 font-medium break-words">{v ?? "—"}</dd>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3 border-t pt-3">
              <dt className="col-span-1 text-muted-foreground">Estimated total</dt>
              <dd className="col-span-2 text-lg font-bold text-primary">
                {fmtKES(est.estimated_total)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <label className="flex cursor-pointer items-start gap-3">
            <Checkbox
              checked={consent}
              onCheckedChange={(v) => setConsent(!!v)}
              className="mt-0.5"
            />
            <span className="text-sm leading-snug">
              I understand that FreshDream will confirm my booking on WhatsApp
              before the appointment is final.
            </span>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" type="button" onClick={onBack} disabled={submitting}>
              Back to edit
            </Button>
            <Button
              type="button"
              size="lg"
              className="flex-1"
              onClick={onSubmit}
              disabled={!consent || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                </>
              ) : (
                "Submit Booking Request"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {help && !error && <p className="text-xs text-muted-foreground">{help}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectControlled({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
