import { useEffect, useState } from "react";
import { loadProfile } from "@/features/onboarding/profileStorage";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";
import { supabase } from "@/lib/supabaseClient";

/**
 * Returns the set of module IDs the current user has enabled.
 * Falls back to DEFAULT_MODULES for legacy/new users.
 * Re-runs when the auth session changes so switching users always reflects
 * the correct modules immediately.
 */
export function useEnabledModules(): {
  modules: Set<ModuleId>;
  loading: boolean;
} {
  const [modules, setModules] = useState<Set<ModuleId>>(new Set(DEFAULT_MODULES));
  const [loading, setLoading] = useState(true);
  const [userId, setUserId]   = useState<string | null>(null);

  // Track auth state so we re-fetch when user changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Re-fetch profile whenever userId changes
  useEffect(() => {
    if (userId === null) {
      setModules(new Set(DEFAULT_MODULES));
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    loadProfile().then((profile) => {
      if (cancelled) return;

      // Handle null, undefined, or empty array — all fall back to defaults
      const mods = profile?.enabled_modules;
      if (Array.isArray(mods) && mods.length > 0) {
        setModules(new Set(mods as ModuleId[]));
      } else {
        setModules(new Set(DEFAULT_MODULES));
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [userId]);

  return { modules, loading };
}