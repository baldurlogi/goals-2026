import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import type { ModuleId } from "@/features/modules/modules";
import {
  getActiveUserId,
  getScopedStorageItem,
  scopedKey,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import { queryKeys } from "@/lib/queryKeys";
import { supabase } from "@/lib/supabaseClient";

const LIFE_PROGRESS_OPTIONAL_METRICS_TABLE = "life_progress_optional_metrics";

export type OptionalLifeProgressMetricId =
  | "water_goal"
  | "skincare_routine"
  | "journaling"
  | "sleep_duration_goal";

export type OptionalLifeProgressMetricDefinition = {
  id: OptionalLifeProgressMetricId;
  label: string;
  description: string;
  requiresModule?: ModuleId;
};

export const OPTIONAL_LIFE_PROGRESS_METRICS: OptionalLifeProgressMetricDefinition[] =
  [
    {
      id: "water_goal",
      label: "Water intake",
      description: "Count today's water progress toward your score.",
    },
    {
      id: "skincare_routine",
      label: "Skincare routine",
      description: "Count your completed skincare routine steps.",
      requiresModule: "skincare",
    },
    {
      id: "journaling",
      label: "Journaling",
      description: "Count today's journal note in Mental Wellbeing.",
      requiresModule: "wellbeing",
    },
    {
      id: "sleep_duration_goal",
      label: "Sleep duration goal",
      description: "Count progress toward today's personalized sleep target.",
      requiresModule: "sleep",
    },
  ];

const OPTIONAL_LIFE_PROGRESS_METRIC_IDS = new Set(
  OPTIONAL_LIFE_PROGRESS_METRICS.map((metric) => metric.id),
);

function normalizeOptionalMetrics(
  input: unknown,
): OptionalLifeProgressMetricId[] {
  if (!Array.isArray(input)) return [];

  const next = new Set<OptionalLifeProgressMetricId>();
  for (const value of input) {
    if (
      typeof value === "string" &&
      OPTIONAL_LIFE_PROGRESS_METRIC_IDS.has(
        value as OptionalLifeProgressMetricId,
      )
    ) {
      next.add(value as OptionalLifeProgressMetricId);
    }
  }

  return [...next];
}

function writeOptionalMetricsCache(
  userId: string | null,
  metricIds: OptionalLifeProgressMetricId[],
) {
  if (!userId) return;

  try {
    const key = scopedKey(CACHE_KEYS.LIFE_PROGRESS_OPTIONAL_METRICS, userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(
      CACHE_KEYS.LIFE_PROGRESS_OPTIONAL_METRICS,
      userId,
      JSON.stringify(metricIds),
    );
  } catch {
    // ignore storage failures
  }
}

export function getAvailableOptionalLifeProgressMetrics(
  enabledModules: Set<ModuleId>,
): OptionalLifeProgressMetricDefinition[] {
  return OPTIONAL_LIFE_PROGRESS_METRICS.filter(
    (metric) =>
      !metric.requiresModule || enabledModules.has(metric.requiresModule),
  );
}

export function filterOptionalMetricsForModules(
  metricIds: OptionalLifeProgressMetricId[],
  enabledModules: Set<ModuleId>,
): OptionalLifeProgressMetricId[] {
  const availableIds = new Set(
    getAvailableOptionalLifeProgressMetrics(enabledModules).map(
      (metric) => metric.id,
    ),
  );

  return metricIds.filter((metricId) => availableIds.has(metricId));
}

export function seedOptionalLifeProgressMetrics(
  userId: string | null = getActiveUserId(),
): OptionalLifeProgressMetricId[] {
  try {
    const raw = getScopedStorageItem(
      CACHE_KEYS.LIFE_PROGRESS_OPTIONAL_METRICS,
      userId,
    );
    if (!raw) return [];
    return normalizeOptionalMetrics(JSON.parse(raw));
  } catch {
    return [];
  }
}

async function syncOptionalLifeProgressMetricsToServer(
  userId: string,
  metricIds: OptionalLifeProgressMetricId[],
) {
  const { error } = await supabase.from(LIFE_PROGRESS_OPTIONAL_METRICS_TABLE).upsert(
    {
      user_id: userId,
      optional_metric_ids: metricIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error("Couldn't save your optional score metrics.");
  }
}

export async function loadOptionalLifeProgressMetrics(
  userId: string | null = getActiveUserId(),
): Promise<OptionalLifeProgressMetricId[]> {
  if (!userId) return [];

  const seeded = seedOptionalLifeProgressMetrics(userId);
  const { data, error } = await supabase
    .from(LIFE_PROGRESS_OPTIONAL_METRICS_TABLE)
    .select("optional_metric_ids")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("loadOptionalLifeProgressMetrics error:", error);
    return seeded;
  }

  if (!data) {
    if (seeded.length > 0) {
      try {
        await syncOptionalLifeProgressMetricsToServer(userId, seeded);
      } catch (syncError) {
        console.warn("syncOptionalLifeProgressMetricsToServer error:", syncError);
      }
    }
    return seeded;
  }

  const serverMetricIds = normalizeOptionalMetrics(data.optional_metric_ids);
  writeOptionalMetricsCache(userId, serverMetricIds);
  return serverMetricIds;
}

export async function saveOptionalLifeProgressMetrics(
  userId: string | null,
  metricIds: OptionalLifeProgressMetricId[],
): Promise<OptionalLifeProgressMetricId[]> {
  if (!userId) {
    throw new Error("You need to be signed in to save optional score metrics.");
  }

  const normalized = normalizeOptionalMetrics(metricIds);
  await syncOptionalLifeProgressMetricsToServer(userId, normalized);
  writeOptionalMetricsCache(userId, normalized);
  return normalized;
}

export function useOptionalLifeProgressMetrics(userId: string | null) {
  return useQuery<OptionalLifeProgressMetricId[]>({
    queryKey: queryKeys.lifeProgressOptionalMetrics(userId),
    queryFn: () => loadOptionalLifeProgressMetrics(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
    placeholderData: userId ? seedOptionalLifeProgressMetrics(userId) : [],
  });
}

export function useSaveOptionalLifeProgressMetricsMutation() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    OptionalLifeProgressMetricId[],
    Error,
    OptionalLifeProgressMetricId[],
    {
      previous?: OptionalLifeProgressMetricId[];
      queryKey: ReturnType<typeof queryKeys.lifeProgressOptionalMetrics>;
    }
  >({
    mutationFn: async (metricIds) => {
      return saveOptionalLifeProgressMetrics(userId, metricIds);
    },
    onMutate: async (metricIds) => {
      const queryKey = queryKeys.lifeProgressOptionalMetrics(userId);
      const normalized = normalizeOptionalMetrics(metricIds);

      await queryClient.cancelQueries({ queryKey });

      const previous =
        queryClient.getQueryData<OptionalLifeProgressMetricId[]>(queryKey);
      queryClient.setQueryData(queryKey, normalized);
      writeOptionalMetricsCache(userId, normalized);

      return { previous, queryKey };
    },
    onError: (_error, _metricIds, context) => {
      if (!context) return;

      const rollback = context.previous ?? [];
      queryClient.setQueryData(context.queryKey, rollback);
      writeOptionalMetricsCache(userId, rollback);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(
        queryKeys.lifeProgressOptionalMetrics(userId),
        saved,
      );
      writeOptionalMetricsCache(userId, saved);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.lifeProgressOptionalMetrics(userId),
      });
    },
  });
}
