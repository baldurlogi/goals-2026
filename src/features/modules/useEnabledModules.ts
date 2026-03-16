import { useEffect, useMemo, useState } from "react";
import {
  loadProfile,
  PROFILE_CHANGED_EVENT,
  readProfileCache,
} from "@/features/onboarding/profileStorage";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";
import { useAuth } from "@/features/auth/authContext";

function getModulesFromCache(userId: string | null): Set<ModuleId> | null {
  if (!userId) return null;

  const cached = readProfileCache(userId);
  const mods = cached?.enabled_modules;

  if (Array.isArray(mods) && mods.length > 0) {
    return new Set(mods as ModuleId[]);
  }

  return null;
}

export function useEnabledModules(): {
  modules: Set<ModuleId>;
  loading: boolean;
} {
  const { userId, authReady } = useAuth();

  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [loadedModules, setLoadedModules] = useState<Set<ModuleId>>(
    () => new Set(DEFAULT_MODULES),
  );

  useEffect(() => {
    if (!authReady || userId === null) return;

    let cancelled = false;

    const syncModules = async () => {
      try {
        const profile = await loadProfile();
        if (cancelled) return;

        const mods = profile?.enabled_modules;
        const nextModules =
          Array.isArray(mods) && mods.length > 0
            ? new Set(mods as ModuleId[])
            : new Set(DEFAULT_MODULES);

        setLoadedModules(nextModules);
        setLoadedUserId(userId);
      } catch (error) {
        console.warn("useEnabledModules load error:", error);

        if (cancelled) return;

        const cachedModules = getModulesFromCache(userId);
        if (cachedModules) {
          setLoadedModules(cachedModules);
          setLoadedUserId(userId);
        }
      }
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
  }, [authReady, userId]);

  const modules = useMemo(() => {
    if (!authReady || userId === null) {
      return new Set(DEFAULT_MODULES);
    }

    if (userId === null) {
      return new Set(DEFAULT_MODULES);
    }

    if (loadedUserId === userId) {
      return loadedModules;
    }

    const cachedModules = getModulesFromCache(userId);
    if (cachedModules) {
      return cachedModules;
    }

    return loadedModules;
  }, [authReady, userId, loadedUserId, loadedModules]);

  const loading = !authReady || (userId !== null && loadedUserId !== userId);

  return { modules, loading };
}
