import { useMemo } from "react";
import { DEFAULT_MODULES, type ModuleId } from "@/features/modules/modules";
import { useProfileQuery } from "@/features/onboarding/useProfileQuery";

function deriveModules(enabledModules: ModuleId[] | null | undefined): Set<ModuleId> {
  return Array.isArray(enabledModules) && enabledModules.length > 0
    ? new Set(enabledModules)
    : new Set(DEFAULT_MODULES);
}

export function useEnabledModules(): { modules: Set<ModuleId>; loading: boolean } {
  const profileQuery = useProfileQuery();

  const modules = useMemo(
    () => deriveModules(profileQuery.data?.enabled_modules),
    [profileQuery.data?.enabled_modules],
  );

  return {
    modules,
    loading: profileQuery.isLoading,
  };
}
