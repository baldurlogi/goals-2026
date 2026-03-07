import { useEffect, useState } from "react";
import { loadProfile } from "@/features/onboarding/profileStorage";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";

/**
 * Returns the set of module IDs the current user has enabled.
 * Falls back to DEFAULT_MODULES for legacy users who predate the modules column.
 */
export function useEnabledModules(): {
  modules: Set<ModuleId>;
  loading: boolean;
} {
  const [modules, setModules] = useState<Set<ModuleId>>(new Set(DEFAULT_MODULES));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadProfile().then((profile) => {
      if (cancelled) return;
      if (profile?.enabled_modules && profile.enabled_modules.length > 0) {
        setModules(new Set(profile.enabled_modules as ModuleId[]));
      } else {
        // Legacy user or null — show all default modules
        setModules(new Set(DEFAULT_MODULES));
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { modules, loading };
}