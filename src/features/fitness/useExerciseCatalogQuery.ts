import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  getExerciseCatalogFilters,
  getExerciseSwapCandidates,
  searchExerciseCatalog,
} from "./exerciseCatalogClient";
import type {
  ExerciseCatalogFilters,
  ExerciseCatalogItem,
  ExerciseCatalogSearchParams,
  ExerciseSwapParams,
} from "./exerciseCatalogTypes";

export function useExerciseCatalogSearchQuery(
  params: ExerciseCatalogSearchParams,
  options?: { enabled?: boolean },
) {
  const { userId, authReady } = useAuth();
  const enabled = (options?.enabled ?? true) &&
    authReady &&
    Boolean(userId) &&
    Boolean(params.query?.trim() || params.target?.trim() || params.equipment?.trim());

  return useQuery<ExerciseCatalogItem[]>({
    queryKey: queryKeys.fitnessExerciseSearch(
      userId,
      params.query?.trim() ?? "",
      params.target?.trim() ?? "",
      params.equipment?.trim() ?? "",
      params.limit ?? 12,
    ),
    queryFn: async () => searchExerciseCatalog(params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useExerciseSwapCandidatesQuery(
  params: ExerciseSwapParams,
  options?: { enabled?: boolean },
) {
  const { userId, authReady } = useAuth();
  const enabled = (options?.enabled ?? true) &&
    authReady &&
    Boolean(userId) &&
    Boolean(params.currentExerciseName?.trim() || params.target?.trim());

  return useQuery<ExerciseCatalogItem[]>({
    queryKey: queryKeys.fitnessExerciseSwap(
      userId,
      params.currentExerciseId ?? "",
      params.currentExerciseName?.trim() ?? "",
      params.target?.trim() ?? "",
      params.equipment?.trim() ?? "",
      params.limit ?? 12,
    ),
    queryFn: async () => getExerciseSwapCandidates(params),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useExerciseCatalogFiltersQuery(
  options?: { enabled?: boolean },
) {
  const { userId, authReady } = useAuth();
  const enabled = (options?.enabled ?? true) && authReady && Boolean(userId);

  return useQuery<ExerciseCatalogFilters>({
    queryKey: queryKeys.fitnessExerciseFilters(userId),
    queryFn: getExerciseCatalogFilters,
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
    refetchOnWindowFocus: false,
  });
}
