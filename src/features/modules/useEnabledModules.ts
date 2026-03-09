import { useEffect, useMemo, useState } from "react";
import {
  loadProfile,
  PROFILE_CHANGED_EVENT,
} from "@/features/onboarding/profileStorage";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";
import { supabase } from "@/lib/supabaseClient";

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

  useEffect(() => {
    if (!authResolved || userId === null) return;

    let cancelled = false;

    const syncModules = async () => {
      const profile = await loadProfile();
      if (cancelled) return;

      const mods = profile?.enabled_modules;
      const nextModules =
        Array.isArray(mods) && mods.length > 0
          ? new Set(mods as ModuleId[])
          : new Set(DEFAULT_MODULES);

      setLoadedModules(nextModules);
      setLoadedUserId(userId);
    };

    const handleProfileChanged = () => {
      void syncModules();
    };

    void syncModules();
    window.addEventListener(PROFILE_CHANGED_EVENT, handleProfileChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_CHANGED_EVENT, handleProfileChanged);
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