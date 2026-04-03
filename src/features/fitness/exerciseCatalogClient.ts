import { getSupabaseFunctionUrl, supabase } from "@/lib/supabaseClient";
import type {
  ExerciseCatalogFilters,
  ExerciseCatalogItem,
  ExerciseCatalogSearchParams,
  ExerciseSwapParams,
} from "./exerciseCatalogTypes";

const HYPER_RESPONDER_URL = getSupabaseFunctionUrl("hyper-responder");

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be signed in.");
  }

  return session.access_token;
}

async function callExerciseCatalog<T>(
  body: Record<string, unknown>,
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(HYPER_RESPONDER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();

  if (!response.ok) {
    let message = `Exercise metadata request failed (${response.status})`;

    try {
      const parsed = JSON.parse(raw) as {
        error?: string;
        details?: string;
      };

      if (parsed.error) {
        message = parsed.error;
        if (parsed.details) {
          message += `: ${parsed.details}`;
        }
      }
    } catch {
      if (raw) {
        message += `: ${raw}`;
      }
    }

    throw new Error(message);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Exercise metadata returned invalid JSON.");
  }
}

export async function searchExerciseCatalog(
  params: ExerciseCatalogSearchParams,
): Promise<ExerciseCatalogItem[]> {
  const data = await callExerciseCatalog<{ exercises?: ExerciseCatalogItem[] }>({
    action: "fitness_exercise_search",
    exerciseQuery: params.query?.trim() || undefined,
    target: params.target?.trim() || undefined,
    equipment: params.equipment?.trim() || undefined,
    limit: params.limit,
  });

  return Array.isArray(data.exercises) ? data.exercises : [];
}

export async function getExerciseSwapCandidates(
  params: ExerciseSwapParams,
): Promise<ExerciseCatalogItem[]> {
  const data = await callExerciseCatalog<{ exercises?: ExerciseCatalogItem[] }>({
    action: "fitness_exercise_swap",
    currentExercise: {
      externalExerciseId: params.currentExerciseId ?? null,
      name: params.currentExerciseName ?? null,
      target: params.target ?? null,
      equipment: params.equipment ?? null,
    },
    limit: params.limit,
  });

  return Array.isArray(data.exercises) ? data.exercises : [];
}

export async function getExerciseCatalogFilters(): Promise<ExerciseCatalogFilters> {
  const data = await callExerciseCatalog<Partial<ExerciseCatalogFilters>>({
    action: "fitness_exercise_filters",
  });

  return {
    targets: Array.isArray(data.targets)
      ? data.targets.filter((value): value is string => typeof value === "string")
      : [],
    equipment: Array.isArray(data.equipment)
      ? data.equipment.filter((value): value is string => typeof value === "string")
      : [],
  };
}
