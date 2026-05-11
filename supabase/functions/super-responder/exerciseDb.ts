type ExerciseDbConfig = {
  baseUrl: string;
  apiKey?: string | null;
  apiHost?: string | null;
  timeoutMs?: number;
};

export type ExerciseCatalogSearchInput = {
  query?: string;
  target?: string;
  equipment?: string;
  limit?: number;
};

export type ExerciseSwapInput = {
  currentExerciseId?: string | null;
  currentExerciseName?: string | null;
  target?: string | null;
  equipment?: string | null;
  limit?: number;
};

export type ExerciseCatalogItem = {
  source: "exercisedb";
  externalExerciseId: string;
  name: string;
  target: string | null;
  equipment: string | null;
  bodyPart: string | null;
  secondaryMuscles: string[];
  instructions: string[];
  imageUrl: string | null;
  videoUrl: string | null;
};

export type ExerciseCatalogFilters = {
  targets: string[];
  equipment: string[];
};

type ExerciseDbErrorCode =
  | "not_configured"
  | "timeout"
  | "rate_limited"
  | "upstream_error"
  | "invalid_response";

export class ExerciseDbError extends Error {
  code: ExerciseDbErrorCode;
  status: number;
  details: string | null;

  constructor(
    code: ExerciseDbErrorCode,
    message: string,
    status = 500,
    details: string | null = null,
  ) {
    super(message);
    this.name = "ExerciseDbError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const DEFAULT_TIMEOUT_MS = 6000;

export async function searchExerciseCatalog(
  config: ExerciseDbConfig,
  input: ExerciseCatalogSearchInput,
): Promise<ExerciseCatalogItem[]> {
  const limit = clampLimit(input.limit);

  const raw = await fetchExerciseCollection(config, input);
  const normalized = raw
    .map(normalizeExerciseCatalogItem)
    .filter(
      (item): item is ExerciseCatalogItem => item !== null,
    );

  return rankExerciseResults(normalized, input).slice(0, limit);
}

export async function getExerciseSwapCandidates(
  config: ExerciseDbConfig,
  input: ExerciseSwapInput,
): Promise<ExerciseCatalogItem[]> {
  const limit = clampLimit(input.limit);

  const primaryResults = await searchExerciseCatalog(config, {
    target: input.target ?? undefined,
    equipment: input.equipment ?? undefined,
    limit: Math.max(limit * 2, 10),
  });

  const primaryFiltered = excludeCurrentExercise(primaryResults, input);
  if (primaryFiltered.length >= limit || !input.target) {
    return primaryFiltered.slice(0, limit);
  }

  const broadenedResults = await searchExerciseCatalog(config, {
    target: input.target,
    limit: Math.max(limit * 3, 12),
  });

  return excludeCurrentExercise(
    dedupeExerciseCatalogItems([...primaryFiltered, ...broadenedResults]),
    input,
  ).slice(0, limit);
}

export async function getExerciseCatalogFilters(
  config: ExerciseDbConfig,
): Promise<ExerciseCatalogFilters> {
  const [targets, equipment] = await Promise.all([
    fetchStringListWithFallback(config, [
      "/targets",
      "/targetList",
      "/exercises/targets",
    ]),
    fetchStringListWithFallback(config, [
      "/equipment",
      "/equipmentList",
      "/exercises/equipment",
    ]),
  ]);

  return {
    targets,
    equipment,
  };
}

async function fetchExerciseCollection(
  config: ExerciseDbConfig,
  input: ExerciseCatalogSearchInput,
): Promise<unknown[]> {
  const searchParams = buildExerciseSearchParams(input);

  const candidates = [
    { path: "/exercises/search", searchParams },
    { path: "/exercises", searchParams },
    { path: "/api/v1/exercises/search", searchParams },
    { path: "/api/v1/exercises", searchParams },
  ];

  let lastError: ExerciseDbError | null = null;

  for (const candidate of candidates) {
    try {
      const data = await fetchExerciseDbJson(config, candidate.path, candidate.searchParams);
      const array = extractArrayPayload(data);
      if (array) return array;
    } catch (error) {
      if (error instanceof ExerciseDbError) {
        if (
          error.status === 404 ||
          error.code === "invalid_response"
        ) {
          lastError = error;
          continue;
        }

        throw error;
      }

      throw error;
    }
  }

  throw lastError ??
    new ExerciseDbError(
      "invalid_response",
      "Exercise search returned an unexpected response.",
      502,
    );
}

async function fetchStringListWithFallback(
  config: ExerciseDbConfig,
  paths: string[],
): Promise<string[]> {
  let lastError: ExerciseDbError | null = null;

  for (const path of paths) {
    try {
      const data = await fetchExerciseDbJson(config, path);
      const list = extractStringList(data);
      if (list.length > 0) return list;
    } catch (error) {
      if (error instanceof ExerciseDbError) {
        if (
          error.status === 404 ||
          error.code === "invalid_response"
        ) {
          lastError = error;
          continue;
        }

        throw error;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

async function fetchExerciseDbJson(
  config: ExerciseDbConfig,
  path: string,
  searchParams?: URLSearchParams,
): Promise<unknown> {
  if (!config.baseUrl.trim()) {
    throw new ExerciseDbError(
      "not_configured",
      "Missing EXERCISEDB_API_BASE_URL.",
      500,
    );
  }

  const base = config.baseUrl.replace(/\/+$/, "");
  const query = searchParams?.toString();
  const url = `${base}${path}${query ? `?${query}` : ""}`;

  const headers = new Headers({
    "Accept": "application/json",
  });

  if (config.apiKey) {
    headers.set("x-rapidapi-key", config.apiKey);
    headers.set("Authorization", `Bearer ${config.apiKey}`);
  }

  if (config.apiHost) {
    headers.set("x-rapidapi-host", config.apiHost);
  }

  const controller = new AbortController();
  const timeoutMs = Math.max(1000, config.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    const raw = await response.text();

    if (!response.ok) {
      if (response.status === 429) {
        throw new ExerciseDbError(
          "rate_limited",
          "Exercise search is temporarily rate limited.",
          429,
          raw || null,
        );
      }

      throw new ExerciseDbError(
        response.status >= 500 ? "upstream_error" : "invalid_response",
        "Exercise metadata request failed.",
        response.status,
        raw || null,
      );
    }

    try {
      return JSON.parse(raw);
    } catch {
      throw new ExerciseDbError(
        "invalid_response",
        "Exercise metadata returned invalid JSON.",
        502,
        raw || null,
      );
    }
  } catch (error) {
    if (error instanceof ExerciseDbError) throw error;

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ExerciseDbError(
        "timeout",
        "Exercise metadata request timed out.",
        504,
      );
    }

    throw new ExerciseDbError(
      "upstream_error",
      "Exercise metadata request failed.",
      502,
      error instanceof Error ? error.message : null,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildExerciseSearchParams(
  input: ExerciseCatalogSearchInput,
): URLSearchParams {
  const params = new URLSearchParams();

  const query = input.query?.trim();
  const target = input.target?.trim();
  const equipment = input.equipment?.trim();
  const limit = clampLimit(input.limit);

  if (query) {
    params.set("name", query);
    params.set("query", query);
    params.set("search", query);
  }

  if (target) {
    params.set("target", target);
    params.set("muscle", target);
    params.set("targetMuscle", target);
  }

  if (equipment) {
    params.set("equipment", equipment);
  }

  params.set("limit", String(limit));

  return params;
}

function extractArrayPayload(data: unknown): unknown[] | null {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const candidates = [
    record.data,
    record.results,
    record.items,
    record.exercises,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return null;
}

function extractStringList(data: unknown): string[] {
  const source = Array.isArray(data)
    ? data
    : extractArrayPayload(data);

  if (!source) return [];

  const values = source.flatMap((item) => {
    if (typeof item === "string") return [item.trim()];
    if (!item || typeof item !== "object") return [];

    const record = item as Record<string, unknown>;
    return [
      normalizeNullableText(record.name),
      normalizeNullableText(record.label),
      normalizeNullableText(record.value),
      normalizeNullableText(record.target),
      normalizeNullableText(record.equipment),
    ].filter((value): value is string => Boolean(value));
  });

  return dedupeStringList(values);
}

function normalizeExerciseCatalogItem(
  value: unknown,
): ExerciseCatalogItem | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const externalExerciseId = normalizeNullableText(
    record.exerciseId ?? record.externalExerciseId ?? record.id,
  );
  const name = normalizeNullableText(record.name ?? record.exerciseName);

  if (!externalExerciseId || !name) {
    return null;
  }

  return {
    source: "exercisedb",
    externalExerciseId,
    name,
    target: firstNonEmptyString([
      normalizeNullableText(record.target),
      normalizeNullableText(
        Array.isArray(record.targetMuscles) ? record.targetMuscles[0] : null,
      ),
    ]),
    equipment: firstNonEmptyString([
      normalizeNullableText(record.equipment),
      normalizeNullableText(
        Array.isArray(record.equipments) ? record.equipments[0] : null,
      ),
    ]),
    bodyPart: firstNonEmptyString([
      normalizeNullableText(record.bodyPart),
      normalizeNullableText(
        Array.isArray(record.bodyParts) ? record.bodyParts[0] : null,
      ),
    ]),
    secondaryMuscles: normalizeStringList(record.secondaryMuscles),
    instructions: normalizeStringList(record.instructions),
    imageUrl: firstNonEmptyString([
      normalizeNullableText(record.imageUrl),
      normalizeNullableText(record.gifUrl),
    ]),
    videoUrl: normalizeNullableText(record.videoUrl),
  };
}

function excludeCurrentExercise(
  items: ExerciseCatalogItem[],
  input: ExerciseSwapInput,
): ExerciseCatalogItem[] {
  const currentId = input.currentExerciseId?.trim().toLowerCase() ?? null;
  const currentName = input.currentExerciseName?.trim().toLowerCase() ?? null;

  return items.filter((item) => {
    if (currentId && item.externalExerciseId.toLowerCase() === currentId) {
      return false;
    }

    if (currentName && item.name.trim().toLowerCase() === currentName) {
      return false;
    }

    return true;
  });
}

function rankExerciseResults(
  items: ExerciseCatalogItem[],
  input: ExerciseCatalogSearchInput,
): ExerciseCatalogItem[] {
  const query = input.query?.trim().toLowerCase() ?? "";
  const target = input.target?.trim().toLowerCase() ?? "";
  const equipment = input.equipment?.trim().toLowerCase() ?? "";

  return dedupeExerciseCatalogItems(items)
    .filter((item) => {
      if (query && !item.name.toLowerCase().includes(query)) return false;
      if (
        target &&
        ![
          item.target,
          item.bodyPart,
          ...item.secondaryMuscles,
        ].some((value) => value?.toLowerCase().includes(target))
      ) {
        return false;
      }

      if (
        equipment &&
        !(item.equipment?.toLowerCase().includes(equipment) ?? false)
      ) {
        return false;
      }

      return true;
    })
    .sort((left, right) => scoreExercise(right, query, target, equipment) -
      scoreExercise(left, query, target, equipment));
}

function scoreExercise(
  item: ExerciseCatalogItem,
  query: string,
  target: string,
  equipment: string,
): number {
  let score = 0;

  const name = item.name.toLowerCase();
  const itemTarget = item.target?.toLowerCase() ?? "";
  const itemEquipment = item.equipment?.toLowerCase() ?? "";

  if (query) {
    if (name === query) score += 50;
    else if (name.startsWith(query)) score += 30;
    else if (name.includes(query)) score += 15;
  }

  if (target) {
    if (itemTarget === target) score += 25;
    else if (itemTarget.includes(target)) score += 12;
  }

  if (equipment) {
    if (itemEquipment === equipment) score += 20;
    else if (itemEquipment.includes(equipment)) score += 10;
  }

  return score;
}

function dedupeExerciseCatalogItems(
  items: ExerciseCatalogItem[],
): ExerciseCatalogItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.externalExerciseId}:${item.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return dedupeStringList(
    value
      .map((item) => normalizeNullableText(item))
      .filter((item): item is string => Boolean(item)),
  );
}

function dedupeStringList(values: string[]): string[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalized = value.trim();
    if (!normalized) return false;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeNullableText(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function firstNonEmptyString(values: Array<string | null>): string | null {
  for (const value of values) {
    if (value) return value;
  }

  return null;
}

function clampLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(1, Math.round(value ?? DEFAULT_LIMIT)));
}
