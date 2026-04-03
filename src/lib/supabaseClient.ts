import { createClient } from "@supabase/supabase-js";
import { getSupabaseProjectRef } from "@/lib/queryKeys";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const supabaseProjectRef = getSupabaseProjectRef(supabaseUrl);

if (!supabaseUrl || !supabaseAnon) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    detectSessionInUrl: true,
    persistSession:     true,
    autoRefreshToken:   true,
    flowType:           "pkce",
  },
});

export function getSupabaseFunctionUrl(functionName: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/${functionName}`;
}
