import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { RequireAdmin } from "./admin";

export const Route = createFileRoute("/admin/smoke-test")({
  component: () => (
    <RequireAdmin>
      <SmokeTestPage />
    </RequireAdmin>
  ),
});

type Outcome = "pass" | "fail" | "warn";

interface TestResult {
  name: string;
  description: string;
  outcome: Outcome;
  message: string;
  details?: Record<string, unknown> | null;
  insertedId?: string;
  error?: { code?: string; message: string; details?: string; hint?: string } | null;
}

const cleanPayload = () => ({
  full_name: "Smoke Test User",
  whatsapp_number: "+254712345678",
  email: "smoke@test.local",
  property_type: "Private Home",
  exact_address: "Smoke Test Address 123, Nairobi",
  area_zone: "Zone B – Ruaraka / Ridgeways / Kahawa Sukari / Kahawa Wendani / Mwiki – KES 500",
  cleaning_package: "Deep Mattress Refresh – from KES 2,499",
  mattress_size: "Queen – KES 2,499",
  number_of_mattresses: 2,
  addons: ["Sleep Area Dust Refresh – KES 300"],
  special_notes: "Automated smoke test — safe to delete.",
  preferred_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
  preferred_time_window: "Morning",
  upload_photo_url: null,
});

function SmokeTestPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const run = async () => {
    setRunning(true);
    setResults([]);
    const out: TestResult[] = [];
    const insertedIds: string[] = [];

    // Test 1: clean insert → expect 201 + trigger computes pricing & resets status
    {
      const payload = cleanPayload();
      const { data, error } = await supabase
        .from("booking_requests")
        .insert(payload)
        .select("id, request_id, mattress_price, location_fee, addons_price, estimated_total, status, payment_status, appointment_status")
        .single();

      if (error) {
        out.push({
          name: "1. Clean insert",
          description: "Valid minimal payload should be accepted by RLS.",
          outcome: "fail",
          message: `Insert rejected: ${error.message}`,
          error: { code: error.code, message: error.message, details: error.details, hint: error.hint },
        });
      } else {
        insertedIds.push(data.id);
        const expected = { mattress_price: 2499, location_fee: 500, addons_price: 300, estimated_total: 2499 * 2 + 500 + 300 };
        const triggerOk =
          data.mattress_price === expected.mattress_price &&
          data.location_fee === expected.location_fee &&
          data.addons_price === expected.addons_price &&
          data.estimated_total === expected.estimated_total;
        const statusOk =
          data.status === "New Request" &&
          data.payment_status === "Not requested yet" &&
          data.appointment_status === "Not confirmed";

        out.push({
          name: "1. Clean insert",
          description: "Valid payload + trigger computes pricing & resets status.",
          outcome: triggerOk && statusOk ? "pass" : "fail",
          message: triggerOk && statusOk
            ? `Accepted. Trigger computed correctly (total = KES ${data.estimated_total.toLocaleString("en-KE")}).`
            : "Accepted but trigger output is unexpected.",
          details: { expected, actual: data },
          insertedId: data.id,
        });
      }
    }

    // Test 2: manipulated insert → trigger must overwrite pricing & status
    {
      const payload = {
        ...cleanPayload(),
        full_name: "Smoke Test Manipulated",
        // attacker-supplied values that MUST be overwritten by the trigger
        mattress_price: 1,
        location_fee: 1,
        addons_price: 1,
        estimated_total: 1,
        status: "Paid",
        payment_status: "Confirmed paid",
        appointment_status: "Completed",
        internal_notes: "I am an attacker",
      } as ReturnType<typeof cleanPayload> & Record<string, unknown>;

      const { data, error } = await supabase
        .from("booking_requests")
        .insert(payload)
        .select("id, mattress_price, location_fee, addons_price, estimated_total, status, payment_status, appointment_status, internal_notes")
        .single();

      if (error) {
        out.push({
          name: "2. Manipulated insert",
          description: "Client-supplied pricing/status must not be trusted.",
          outcome: "warn",
          message: `RLS rejected the manipulated payload (also acceptable): ${error.message}`,
          error: { code: error.code, message: error.message, details: error.details, hint: error.hint },
        });
      } else {
        insertedIds.push(data.id);
        const overwritten =
          data.mattress_price === 2499 &&
          data.location_fee === 500 &&
          data.addons_price === 300 &&
          data.estimated_total === 2499 * 2 + 500 + 300 &&
          data.status === "New Request" &&
          data.payment_status === "Not requested yet" &&
          data.appointment_status === "Not confirmed" &&
          data.internal_notes === null;

        out.push({
          name: "2. Manipulated insert",
          description: "Trigger must overwrite client-supplied pricing & status.",
          outcome: overwritten ? "pass" : "fail",
          message: overwritten
            ? "Trigger correctly overwrote all client-supplied admin fields."
            : "SECURITY ISSUE: client-supplied values survived the trigger.",
          details: data,
          insertedId: data.id,
        });
      }
    }

    // Test 3: invalid enum → RLS must reject
    {
      const payload = { ...cleanPayload(), area_zone: "Fake Zone Z" };
      const { error } = await supabase.from("booking_requests").insert(payload).select("id").single();
      out.push({
        name: "3. Invalid enum (area_zone)",
        description: "RLS must reject non-whitelisted area_zone.",
        outcome: error ? "pass" : "fail",
        message: error ? `Correctly rejected: ${error.message}` : "SECURITY ISSUE: insert was accepted.",
        error: error ? { code: error.code, message: error.message, details: error.details, hint: error.hint } : null,
      });
    }

    // Test 4: bad phone format → RLS must reject
    {
      const payload = { ...cleanPayload(), whatsapp_number: "not-a-phone" };
      const { error } = await supabase.from("booking_requests").insert(payload).select("id").single();
      out.push({
        name: "4. Invalid phone format",
        description: "RLS regex must reject malformed WhatsApp numbers.",
        outcome: error ? "pass" : "fail",
        message: error ? `Correctly rejected: ${error.message}` : "SECURITY ISSUE: insert was accepted.",
        error: error ? { code: error.code, message: error.message, details: error.details, hint: error.hint } : null,
      });
    }

    // Cleanup: delete inserted smoke-test rows (admin can delete via RLS)
    if (insertedIds.length > 0) {
      const { error } = await supabase.from("booking_requests").delete().in("id", insertedIds);
      out.push({
        name: "Cleanup",
        description: "Delete smoke-test rows so they don't pollute the dashboard.",
        outcome: error ? "warn" : "pass",
        message: error
          ? `Could not delete test rows: ${error.message}`
          : `Deleted ${insertedIds.length} test row(s).`,
        error: error ? { code: error.code, message: error.message } : null,
      });
    }

    setResults(out);
    setRunning(false);
  };

  const summary = results.reduce(
    (acc, r) => {
      acc[r.outcome]++;
      return acc;
    },
    { pass: 0, fail: 0, warn: 0 } as Record<Outcome, number>,
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <p className="text-sm font-medium">RLS Smoke Test</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking RLS & Trigger smoke test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Runs 4 live inserts against <code>booking_requests</code> as your current admin session, then deletes them.
              Verifies: clean insert succeeds, trigger overwrites manipulated values, invalid enum/phone are rejected by RLS.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={run} disabled={running}>
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running…
                  </>
                ) : (
                  "Run smoke test"
                )}
              </Button>
              {results.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    {summary.pass} pass
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    {summary.fail} fail
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    {summary.warn} warn
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {results.map((r, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                </div>
                <OutcomeBadge outcome={r.outcome} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{r.message}</p>
              {r.error && (
                <>
                  <Separator />
                  <div className="space-y-1 rounded-md bg-red-50 p-3 text-xs">
                    <p className="font-semibold text-red-900">Error</p>
                    {r.error.code && (
                      <p>
                        <span className="text-muted-foreground">code:</span>{" "}
                        <code className="text-red-900">{r.error.code}</code>
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">message:</span>{" "}
                      <code className="text-red-900">{r.error.message}</code>
                    </p>
                    {r.error.details && (
                      <p>
                        <span className="text-muted-foreground">details:</span>{" "}
                        <code className="text-red-900">{r.error.details}</code>
                      </p>
                    )}
                    {r.error.hint && (
                      <p>
                        <span className="text-muted-foreground">hint:</span>{" "}
                        <code className="text-red-900">{r.error.hint}</code>
                      </p>
                    )}
                  </div>
                </>
              )}
              {r.details && (
                <>
                  <Separator />
                  <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed">
{JSON.stringify(r.details, null, 2)}
                  </pre>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  if (outcome === "pass") {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Pass
      </Badge>
    );
  }
  if (outcome === "fail") {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <XCircle className="mr-1 h-3 w-3" /> Fail
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
      <AlertTriangle className="mr-1 h-3 w-3" /> Warn
    </Badge>
  );
}
