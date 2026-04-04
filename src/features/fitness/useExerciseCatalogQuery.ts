import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/authContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  getExerciseCatalogFilters,
  getExerciseImage,
  getExercisePreview,
  getExerciseSwapCandidates,
  searchExerciseCatalog,
} from "./exerciseCatalogClient";
import type {
  ExerciseCatalogFilters,
  ExerciseImageParams,
  ExerciseImageResult,
  ExercisePreviewParams,
  ExercisePreviewResult,
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
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
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
    staleTime: 15 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
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
    retry: false,
  });
}

export function useExerciseImageQuery(
  params: ExerciseImageParams,
  options?: { enabled?: boolean },
) {
  const { userId, authReady } = useAuth();
  const enabled = (options?.enabled ?? true) &&
    authReady &&
    Boolean(userId) &&
    Boolean(params.exerciseId.trim());

  return useQuery<ExerciseImageResult>({
    queryKey: queryKeys.fitnessExerciseImage(
      userId,
      params.exerciseId.trim(),
      params.resolution ?? 180,
    ),
    queryFn: async () => getExerciseImage(params),
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useExercisePreviewQuery(
  params: ExercisePreviewParams,
  options?: { enabled?: boolean },
) {
  const { userId, authReady } = useAuth();
  const enabled = (options?.enabled ?? true) &&
    authReady &&
    Boolean(userId) &&
    Boolean(params.exerciseId?.trim() || params.query?.trim());

  return useQuery<ExercisePreviewResult>({
    queryKey: queryKeys.fitnessExercisePreview(
      userId,
      params.exerciseId?.trim() ?? "",
      params.query?.trim() ?? "",
      params.target?.trim() ?? "",
      params.equipment?.trim() ?? "",
      params.resolution ?? 180,
    ),
    queryFn: async () => getExercisePreview(params),
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
