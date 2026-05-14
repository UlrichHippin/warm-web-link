import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Surface a helpful error in dev rather than a cryptic Supabase failure.
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. " +
      "Add them to your .env file (project root) using values from " +
      "your Supabase project → Settings → API.",
  );
}

export const supabase = createClient(url ?? "http://invalid.local", anonKey ?? "invalid", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "freshdream-auth",
  },
});

export const supabaseConfigured = Boolean(url && anonKey);
