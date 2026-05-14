import { z } from "zod";

// ----- Constants & options -------------------------------------------------

export const WHATSAPP_NUMBER = "254708835235";
export const WHATSAPP_DISPLAY = "+254 708 835 235";
export const ADMIN_EMAIL = "bookings@freshdream.co.ke";

export const PROPERTY_TYPES = [
  "Private Home",
  "Airbnb Host",
  "Serviced Apartment",
  "Hotel / Guesthouse",
  "Other",
] as const;

export const AREA_ZONES = [
  "Zone A – Roysambu / Zimmerman / Mirema / TRM / Kasarani – KES 300",
  "Zone B – Ruaraka / Ridgeways / Kahawa Sukari / Kahawa Wendani / Mwiki – KES 500",
  "Zone C – CBD / Parklands / Ngara / Pangani / Eastleigh / Kariobangi – KES 800",
  "Other Area – confirm by WhatsApp",
] as const;

export const CLEANING_PACKAGES = [
  "Freshen Up Mattress Refresh – from KES 1,999",
  "Deep Mattress Refresh – from KES 2,499",
  "Airbnb Turnover Mattress Refresh – from KES 2,999",
  "Host / Multiple Mattress Request – price confirmed after review",
] as const;

export const MATTRESS_SIZES = [
  "Single – KES 1,999",
  "Double – KES 2,299",
  "Queen – KES 2,499",
  "King – KES 2,999",
  "Not sure",
  "Multiple mattresses",
] as const;

export const ADDONS = [
  "Sleep Area Dust Refresh – KES 300",
  "Extra Pillow / Small Item Refresh – KES 200",
  "Stain Photo Check – Free",
  "Urgent / Same-Day Request – confirm by WhatsApp",
] as const;

export const TIME_WINDOWS = ["Morning", "Midday", "Afternoon", "Evening", "Flexible"] as const;

export const STATUS_OPTIONS = [
  "New Request",
  "WhatsApp Contact Pending",
  "Customer Contacted",
  "Availability Confirmed",
  "Price Confirmed",
  "Awaiting Payment",
  "Payment Confirmed",
  "Appointment Scheduled",
  "Cleaner Assigned",
  "In Progress",
  "Completed",
  "Cancelled",
  "Reschedule Requested",
  "No Response",
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  "Not requested yet",
  "Awaiting payment",
  "Payment confirmed",
  "Payment issue",
  "Refunded",
  "Not applicable",
] as const;

export const APPOINTMENT_STATUS_OPTIONS = [
  "Not confirmed",
  "Confirmed",
  "Rescheduled",
  "Cancelled",
  "Completed",
] as const;

// ----- Pricing logic -------------------------------------------------------

export function mattressPrice(size: string): number {
  if (size.startsWith("Single")) return 1999;
  if (size.startsWith("Double")) return 2299;
  if (size.startsWith("Queen")) return 2499;
  if (size.startsWith("King")) return 2999;
  return 0;
}

export function locationFee(zone: string): number {
  if (zone.startsWith("Zone A")) return 300;
  if (zone.startsWith("Zone B")) return 500;
  if (zone.startsWith("Zone C")) return 800;
  return 0;
}

export function addonsPrice(addons: string[]): number {
  let total = 0;
  for (const a of addons) {
    if (a.startsWith("Sleep Area Dust Refresh")) total += 300;
    else if (a.startsWith("Extra Pillow")) total += 200;
  }
  return total;
}

export interface EstimateInput {
  mattress_size: string;
  area_zone: string;
  number_of_mattresses: number;
  addons: string[];
}

export interface EstimateResult {
  mattress_price: number;
  location_fee: number;
  addons_price: number;
  estimated_total: number;
  needsConfirmation: boolean;
}

export function estimate(input: EstimateInput): EstimateResult {
  const mp = mattressPrice(input.mattress_size);
  const lf = locationFee(input.area_zone);
  const ap = addonsPrice(input.addons ?? []);
  const total = mp * (input.number_of_mattresses || 0) + lf + ap;
  const needsConfirmation =
    !input.mattress_size ||
    input.mattress_size === "Not sure" ||
    input.mattress_size === "Multiple mattresses" ||
    (input.area_zone?.startsWith("Other Area") ?? false) ||
    (input.addons ?? []).some((a) => a.startsWith("Urgent"));
  return {
    mattress_price: mp,
    location_fee: lf,
    addons_price: ap,
    estimated_total: total,
    needsConfirmation,
  };
}

// ----- Request ID ----------------------------------------------------------

export function generateRequestId(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `FD-${yyyy}${mm}${dd}-${suffix}`;
}

// ----- Form schema ---------------------------------------------------------

export const bookingFormSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(120),
  whatsapp_number: z
    .string()
    .trim()
    .min(7, "Enter your WhatsApp number with country code")
    .max(20)
    .regex(/^\+?[0-9 ()-]{7,20}$/, "Please enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(200),
  property_type: z.enum(PROPERTY_TYPES, { message: "Select a property type" }),
  exact_address: z.string().trim().min(5, "Please add building, road and directions").max(1000),
  area_zone: z.enum(AREA_ZONES, { message: "Select an area" }),
  cleaning_package: z.enum(CLEANING_PACKAGES, { message: "Select a package" }),
  mattress_size: z.enum(MATTRESS_SIZES, { message: "Select a mattress size" }),
  number_of_mattresses: z.coerce.number().int().min(1, "At least 1").max(50),
  addons: z.array(z.enum(ADDONS)).default([]),
  special_notes: z.string().trim().max(2000).optional().or(z.literal("")),
  preferred_date: z
    .string()
    .min(1, "Pick a preferred date")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Pick a valid date"),
  preferred_time_window: z.enum(TIME_WINDOWS, { message: "Select a time window" }),
  upload_photo_url: z.string().url().optional().or(z.literal("")),
  consent: z.literal(true, { message: "Please confirm to continue" }),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// ----- WhatsApp message helpers -------------------------------------------

export function waLink(number: string, message: string): string {
  const clean = number.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function fmtKES(n: number | null | undefined): string {
  if (n == null) return "—";
  return `KES ${n.toLocaleString("en-KE")}`;
}
