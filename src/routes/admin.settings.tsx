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

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <RequireAdmin>
      <SettingsPage />
    </RequireAdmin>
  ),
});

function SettingsPage() {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const bookingUrl = `${origin}/`;
  const buttonHtml = `<a href="${bookingUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 24px;border-radius:12px;font-weight:600;text-decoration:none;">Book Mattress Refresh</a>`;
  const iframeHtml = `<iframe src="${bookingUrl}" width="100%" height="900" style="border:0; border-radius:16px;" loading="lazy"></iframe>`;
  const waPrefilled = `https://wa.me/254708835235?text=${encodeURIComponent("Hello FreshDream, I would like to book a mattress refresh. Please send me the booking form.")}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <p className="text-sm font-medium">Sharing & Embed</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Section
          title="1 · Public booking link"
          description="Use this public booking link in Instagram, TikTok, Facebook, WhatsApp Business, Google Business Profile and ads."
          value={bookingUrl}
        />
        <Section
          title="2 · Homepage button"
          description="Add this button to the FreshDream homepage."
          value={buttonHtml}
          multiline
        />
        <Section
          title="3 · Embed (iframe)"
          description="Drop this snippet wherever you want the form embedded."
          value={iframeHtml}
          multiline
        />
        <Section
          title="4 · WhatsApp pre-filled link"
          description="Send this to customers who prefer WhatsApp first."
          value={waPrefilled}
        />
      </main>
    </div>
  );
}

function Section({
  title,
  description,
  value,
  multiline,
}: {
  title: string;
  description: string;
  value: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
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
            <Textarea readOnly value={value} rows={4} className="font-mono text-xs" />
          ) : (
            <Input readOnly value={value} className="font-mono text-xs" />
          )}
        </div>
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </CardContent>
    </Card>
  );
}
