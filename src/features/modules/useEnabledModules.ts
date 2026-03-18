import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { readProfileCache } from "@/features/onboarding/profileStorage";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";
import { queryKeys } from "@/lib/queryKeys";

function getModulesFromCache(userId: string | null): Set<ModuleId> | null {
  if (!userId) return null;

  const cached = readProfileCache(userId);
  const mods = cached?.enabled_modules;

  if (Array.isArray(mods) && mods.length > 0) {
    return new Set(mods as ModuleId[]);
  }

  return null;
}

export function useEnabledModules(): { modules: Set<ModuleId>; loading: boolean } {
  const { userId, authReady } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.profileDerivedModules(userId),
    queryFn: async () => getModulesFromCache(userId) ?? new Set(DEFAULT_MODULES),
    enabled: authReady,
    initialData: getModulesFromCache(userId) ?? new Set(DEFAULT_MODULES),
  });

  const modules = useMemo(() => query.data ?? new Set(DEFAULT_MODULES), [query.data]);
  return { modules, loading: query.isLoading };
}
