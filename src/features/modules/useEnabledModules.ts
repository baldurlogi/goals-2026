import { useEffect, useMemo, useState } from "react";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);

  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loadedModules, setLoadedModules] = useState<Set<ModuleId>>(
    () => new Set(DEFAULT_MODULES),
  );

  // Track auth state so we re-fetch when user changes
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
      setAuthResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUserId(session?.user?.id ?? null);
      setAuthResolved(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Re-fetch profile whenever userId changes
  useEffect(() => {
    if (!authResolved || userId === null) {
      return;
    }

    let cancelled = false;

    loadProfile().then((profile) => {
      if (cancelled) return;

      const mods = profile?.enabled_modules;
      const nextModules =
        Array.isArray(mods) && mods.length > 0
          ? new Set(mods as ModuleId[])
          : new Set(DEFAULT_MODULES);

      setLoadedModules(nextModules);
      setLoadedUserId(userId);
    });

    return () => {
      cancelled = true;
    };
  }, [authResolved, userId]);

  const modules = useMemo(() => {
    if (!authResolved || userId === null) {
      return new Set(DEFAULT_MODULES);
    }

    if (loadedUserId !== userId) {
      return new Set(DEFAULT_MODULES);
    }

    return loadedModules;
  }, [authResolved, userId, loadedUserId, loadedModules]);

  const loading =
    !authResolved || (userId !== null && loadedUserId !== userId);

  return { modules, loading };
}