import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Search,
  Settings,
  LogOut,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  APPOINTMENT_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  STATUS_OPTIONS,
  appointmentBadgeClass,
  fmtKES,
  paymentBadgeClass,
  statusBadgeClass,
} from "@/lib/booking";
import { RequireAdmin } from "./admin";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <RequireAdmin>
      <Dashboard />
    </RequireAdmin>
  ),
});

interface Booking {
  id: string;
  request_id: string;
  created_at: string;
  full_name: string;
  whatsapp_number: string;
  area_zone: string;
  cleaning_package: string;
  mattress_size: string;
  preferred_date: string;
  preferred_time_window: string;
  estimated_total: number | null;
  status: string;
  payment_status: string;
  appointment_status: string;
}

const STATUS_CARDS: Array<{ key: string; label: string }> = [
  { key: "New Request", label: "New Requests" },
  { key: "Availability Confirmed", label: "Confirmed" },
  { key: "Awaiting Payment", label: "Awaiting Payment" },
  { key: "Appointment Scheduled", label: "Scheduled" },
  { key: "Completed", label: "Completed" },
  { key: "Cancelled", label: "Cancelled" },
];

function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<string>("all");
  const [payF, setPayF] = useState<string>("all");
  const [apptF, setApptF] = useState<string>("all");
  const [dateF, setDateF] = useState<string>("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bookings", { search, statusF, payF, apptF, dateF }],
    queryFn: async () => {
      let q = supabase
        .from("booking_requests")
        .select(
          "id,request_id,created_at,full_name,whatsapp_number,area_zone,cleaning_package,mattress_size,preferred_date,preferred_time_window,estimated_total,status,payment_status,appointment_status",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (statusF !== "all") q = q.eq("status", statusF);
      if (payF !== "all") q = q.eq("payment_status", payF);
      if (apptF !== "all") q = q.eq("appointment_status", apptF);
      if (dateF) q = q.eq("preferred_date", dateF);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(
          `full_name.ilike.${s},whatsapp_number.ilike.${s},request_id.ilike.${s}`,
        );
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Booking[];
    },
  });

  // Separate query for the status cards so counts always reflect TOTALS,
  // not the currently-filtered subset.
  const { data: totals } = useQuery({
    queryKey: ["bookings-totals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select("status")
        .limit(5000);
      if (error) throw error;
      const c: Record<string, number> = {};
      for (const r of data ?? []) c[r.status] = (c[r.status] ?? 0) + 1;
      return c;
    },
    staleTime: 30_000,
  });
  const counts = totals ?? {};

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">FreshDream Admin</h1>
            <p className="text-xs text-muted-foreground">Booking requests</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/settings">
                <Settings className="mr-1 h-4 w-4" /> Settings
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" /> Public form
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUS_CARDS.map((s) => (
            <Card
              key={s.key}
              className={`cursor-pointer transition hover:border-primary ${statusF === s.key ? "border-primary" : ""}`}
              onClick={() => setStatusF(statusF === s.key ? "all" : s.key)}
            >
              <CardContent className="space-y-1 p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{counts[s.key] ?? 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, request ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <FilterSelect
              value={statusF}
              onChange={setStatusF}
              placeholder="Status"
              options={STATUS_OPTIONS}
            />
            <FilterSelect
              value={payF}
              onChange={setPayF}
              placeholder="Payment"
              options={PAYMENT_STATUS_OPTIONS}
            />
            <FilterSelect
              value={apptF}
              onChange={setApptF}
              placeholder="Appointment"
              options={APPOINTMENT_STATUS_OPTIONS}
            />
            <div className="md:col-span-5 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateF}
                onChange={(e) => setDateF(e.target.value)}
                className="w-auto"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusF("all");
                  setPayF("all");
                  setApptF("all");
                  setDateF("");
                }}
              >
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Mattress</TableHead>
                  <TableHead>Preferred</TableHead>
                  <TableHead>Estimate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Appt.</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={13} className="py-10 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && (data?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} className="py-10 text-center text-sm text-muted-foreground">
                      No bookings match these filters.
                    </TableCell>
                  </TableRow>
                )}
                {data?.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs">
                      <Link
                        to="/admin/bookings/$requestId"
                        params={{ requestId: b.request_id }}
                        className="text-primary hover:underline"
                      >
                        {b.request_id}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(b.created_at).toLocaleString("en-KE")}
                    </TableCell>
                    <TableCell>{b.full_name}</TableCell>
                    <TableCell className="text-xs">{b.whatsapp_number}</TableCell>
                    <TableCell className="max-w-[12ch] truncate text-xs">
                      {b.area_zone.split(" – ")[0]}
                    </TableCell>
                    <TableCell className="max-w-[16ch] truncate text-xs">
                      {b.cleaning_package.split(" – ")[0]}
                    </TableCell>
                    <TableCell className="text-xs">
                      {b.mattress_size.split(" – ")[0]}
                    </TableCell>
                    <TableCell className="text-xs">
                      {b.preferred_date}
                      <br />
                      <span className="text-muted-foreground">{b.preferred_time_window}</span>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {fmtKES(b.estimated_total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(b.status)}`}>
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${paymentBadgeClass(b.payment_status)}`}>
                        {b.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${appointmentBadgeClass(b.appointment_status)}`}>
                        {b.appointment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/admin/bookings/$requestId"
                        params={{ requestId: b.request_id }}
                      >
                        <Button size="sm" variant="ghost">Open</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
