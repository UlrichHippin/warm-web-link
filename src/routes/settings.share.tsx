import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequireAdmin } from "./admin";

export const Route = createFileRoute("/settings/share")({
  component: () => (
    <RequireAdmin>
      <ShareSettingsPage />
    </RequireAdmin>
  ),
});

const WHATSAPP_LINK =
  "https://wa.me/254708835235?text=Hello%20FreshDream%2C%20I%20would%20like%20to%20book%20a%20mattress%20refresh.%20Please%20send%20me%20the%20booking%20form.";

function ShareSettingsPage() {
  const [bookingUrl, setBookingUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBookingUrl(`${window.location.origin}/`);
    }
  }, []);

  const buttonHtml = `<a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#16a34a;color:white;text-decoration:none;font-weight:600;">
  Book Mattress Refresh
</a>`;

  const iframeHtml = `<iframe src="${bookingUrl}" width="100%" height="900" style="border:0; border-radius:16px;" loading="lazy"></iframe>`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <p className="text-sm font-medium">Sharing & Homepage Integration</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <ShareCard
          title="Social Media Booking Link"
          description="Use this link in Instagram, TikTok, Facebook, WhatsApp Business, Google Business Profile, ads and bio links."
          value={bookingUrl}
          copyLabel="Copy Booking Link"
        />

        <ShareCard
          title="Homepage Button"
          description={`Add this button to the FreshDream homepage. Button text: "Book Mattress Refresh". Button link: ${bookingUrl}`}
          value={buttonHtml}
          copyLabel="Copy Button HTML"
          multiline
          rows={6}
        />

        <ShareCard
          title="Homepage Embed Code"
          description="Use this iframe to embed the booking form inside the FreshDream homepage."
          value={iframeHtml}
          copyLabel="Copy Embed Code"
          multiline
          rows={3}
        />

        <ShareCard
          title="WhatsApp Direct Booking Link"
          description="Use this link when customers should message FreshDream directly."
          value={WHATSAPP_LINK}
          copyLabel="Copy WhatsApp Link"
        />
      </main>
    </div>
  );
}

function ShareCard({
  title,
  description,
  value,
  copyLabel,
  multiline,
  rows = 4,
}: {
  title: string;
  description: string;
  value: string;
  copyLabel: string;
  multiline?: boolean;
  rows?: number;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Snippet</Label>
          {multiline ? (
            <Textarea
              readOnly
              value={value}
              rows={rows}
              className="font-mono text-xs"
            />
          ) : (
            <Input readOnly value={value} className="font-mono text-xs" />
          )}
        </div>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <Check className="mr-1 h-4 w-4" />
          ) : (
            <Copy className="mr-1 h-4 w-4" />
          )}
          {copied ? "Copied" : copyLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
