import { getSupabaseFunctionUrl, supabase } from "@/lib/supabaseClient";
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

const HYPER_RESPONDER_URL = getSupabaseFunctionUrl("hyper-responder");

type ExerciseCatalogErrorCode =
  | "rate_limited"
  | "not_configured"
  | "timeout"
  | "upstream_error"
  | "invalid_response"
  | "unknown";

export class ExerciseCatalogRequestError extends Error {
  status: number;
  code: ExerciseCatalogErrorCode;

  constructor(
    message: string,
    status: number,
    code: ExerciseCatalogErrorCode = "unknown",
  ) {
    super(message);
    this.name = "ExerciseCatalogRequestError";
    this.status = status;
    this.code = code;
  }
}

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
    let code: ExerciseCatalogErrorCode = "unknown";

    try {
      const parsed = JSON.parse(raw) as {
        error?: string;
        details?: string;
        code?: string;
      };

      if (parsed.code === "rate_limited") {
        code = "rate_limited";
        message =
          "Exercise options are temporarily busy on the Rapid free tier. Wait a minute and try again.";
      } else if (
        parsed.code === "not_configured" ||
        parsed.code === "timeout" ||
        parsed.code === "upstream_error" ||
        parsed.code === "invalid_response"
      ) {
        code = parsed.code;
      }

      if (parsed.error) {
        if (code !== "rate_limited") {
          message = parsed.error;
        }
        if (parsed.details && code !== "rate_limited") {
          message += `: ${parsed.details}`;
        }
      }
    } catch {
      if (raw) {
        message += `: ${raw}`;
      }
    }

    throw new ExerciseCatalogRequestError(message, response.status, code);
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

export async function getExerciseImage(
  params: ExerciseImageParams,
): Promise<ExerciseImageResult> {
  return callExerciseCatalog<ExerciseImageResult>({
    action: "fitness_exercise_image",
    exerciseId: params.exerciseId,
    resolution: params.resolution,
  });
}

export async function getExercisePreview(
  params: ExercisePreviewParams,
): Promise<ExercisePreviewResult> {
  return callExerciseCatalog<ExercisePreviewResult>({
    action: "fitness_exercise_preview",
    exerciseId: params.exerciseId ?? undefined,
    exerciseQuery: params.query?.trim() || undefined,
    target: params.target?.trim() || undefined,
    equipment: params.equipment?.trim() || undefined,
    resolution: params.resolution,
  });
}
