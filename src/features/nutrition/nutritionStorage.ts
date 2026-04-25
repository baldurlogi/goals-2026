import { supabase } from "@/lib/supabaseClient";
import {
  getFallbackNutritionPhaseForServer,
  normalizeNutritionPhase,
  type NutritionPhase,
  type StoredNutritionPhase,
} from "@/features/nutrition/nutritionData";
import type { Macros } from "@/features/nutrition/nutritionTypes";
import { meals } from "@/features/nutrition/nutritionData";
import { getLocalDateKey } from "@/hooks/useTodayDate";
import { CACHE_KEYS, assertRegisteredCacheWrite } from "@/lib/cacheRegistry";
import {
  getActiveUserId,
  getScopedStorageItem,
  scopedKey,
} from "@/lib/activeUser";

export const NUTRITION_CHANGED_EVENT = "nutrition:changed";

export const NUTRITION_LOG_CACHE_KEY = CACHE_KEYS.NUTRITION_LOG;
export const NUTRITION_PHASE_CACHE_KEY = CACHE_KEYS.NUTRITION_PHASE;

function logCacheKey(userId: string | null = getActiveUserId()) {
  return scopedKey(NUTRITION_LOG_CACHE_KEY, userId);
}

function phaseCacheKey(userId: string | null = getActiveUserId()) {
  return scopedKey(NUTRITION_PHASE_CACHE_KEY, userId);
}

function emit() {
  window.dispatchEvent(new Event(NUTRITION_CHANGED_EVENT));
}

function todayKey() {
  return getLocalDateKey();
}

export type MealKey =
  | "breakfast1"
  | "breakfast2"
  | "lunchWfh"
  | "lunchOffice"
  | "afternoonSnack"
  | "postWorkout"
  | "dinner";

export type CustomEntry = {
  id: string;
  name: string;
  macros: Macros;
  loggedAt: number;
};

export type SavedMeal = {
  id: string;
  name: string;
  macros: Macros;
  emoji: string;
};

export type NutritionLog = {
  date: string;
  eaten: Partial<Record<MealKey, boolean>>;
  customEntries: CustomEntry[];
};

function emptyLog(date = todayKey()): NutritionLog {
  return { date, eaten: {}, customEntries: [] };
}

function readLogCache(
  userId: string | null = getActiveUserId(),
): NutritionLog | null {
  try {
    const raw = getScopedStorageItem(NUTRITION_LOG_CACHE_KEY, userId);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as NutritionLog;
    if (parsed.date !== todayKey()) return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeLogCache(
  log: NutritionLog,
  userId: string | null = getActiveUserId(),
): void {
  try {
    const key = logCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(log));
  } catch {
    // ignore
  }
}

function readPhaseCache(
  userId: string | null = getActiveUserId(),
): NutritionPhase | null {
  try {
    const raw = getScopedStorageItem(NUTRITION_PHASE_CACHE_KEY, userId);
    return raw ? normalizeNutritionPhase(raw) : null;
  } catch {
    return null;
  }
}

export function seedNutritionPhase(
  userId: string | null = getActiveUserId(),
): NutritionPhase {
  return readPhaseCache(userId) ?? "maintain";
}

function writePhaseCache(
  phase: NutritionPhase,
  userId: string | null = getActiveUserId(),
): void {
  try {
    const key = phaseCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, phase);
  } catch {
    // ignore
  }
}

export function seedNutritionCache(userId: string | null = getActiveUserId()): NutritionLog {
  return readLogCache(userId) ?? emptyLog();
}

export async function loadPhase(userId: string | null = getActiveUserId()): Promise<NutritionPhase> {
  const cached = readPhaseCache(userId);
  if (cached) return cached;

  if (!userId) return "maintain";

  const { data, error } = await supabase
    .from("nutrition_phase")
    .select("phase")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("loadPhase error:", error);
    return "maintain";
  }

  if (!data) {
    await supabase
      .from("nutrition_phase")
      .insert({ user_id: userId, phase: "maintain" });

    writePhaseCache("maintain", userId);
    return "maintain";
  }

  const phase = normalizeNutritionPhase(data.phase as string | null | undefined);
  writePhaseCache(phase, userId);
  return phase;
}

export async function savePhase(
  userIdOrPhase: string | NutritionPhase | null = getActiveUserId(),
  maybePhase?: NutritionPhase,
): Promise<void> {
  const userId = maybePhase === undefined ? getActiveUserId() : userIdOrPhase as string | null;
  const phase = (maybePhase === undefined ? userIdOrPhase : maybePhase) as NutritionPhase;

  if (!userId) {
    emit();
    return;
  }

  writePhaseCache(phase, userId);

  const { error } = await supabase
    .from("nutrition_phase")
    .upsert(
      { user_id: userId, phase: phase as StoredNutritionPhase },
      { onConflict: "user_id" },
    );

  if (error) {
    const fallbackPhase = getFallbackNutritionPhaseForServer(phase);
    const { error: fallbackError } = await supabase
      .from("nutrition_phase")
      .upsert({ user_id: userId, phase: fallbackPhase }, { onConflict: "user_id" });

    if (fallbackError) {
      console.warn("savePhase error:", fallbackError);
    }
  }

  emit();
}

export async function loadNutritionLog(
  userId: string | null = getActiveUserId(),
  date = todayKey(),
): Promise<NutritionLog> {
  const cached = date === todayKey() ? readLogCache(userId) : null;
  if (cached) return cached;

  try {
    if (!userId) return cached ?? emptyLog(date);

    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("log_date, eaten, custom_entries")
      .eq("user_id", userId)
      .eq("log_date", date)
      .maybeSingle();

    if (error) {
      console.warn("loadNutritionLog error:", error);
      return cached ?? emptyLog(date);
    }

    if (!data) {
      const created = {
        user_id: userId,
        log_date: date,
        eaten: {},
        custom_entries: [],
      };

      const { error: insertError } = await supabase
        .from("nutrition_logs")
        .insert(created);

      if (insertError) {
        console.warn("loadNutritionLog insert error:", insertError);
      }

      const fresh = emptyLog(date);
      if (date === todayKey()) writeLogCache(fresh);
      return fresh;
    }

    const log: NutritionLog = {
      date: data.log_date,
      eaten: (data.eaten ?? {}) as NutritionLog["eaten"],
      customEntries: (data.custom_entries ??
        []) as NutritionLog["customEntries"],
    };

    if (date === todayKey()) writeLogCache(log);
    return log;
  } catch (error) {
    console.warn("loadNutritionLog exception:", error);
    return cached ?? emptyLog(date);
  }
}

async function saveNutritionLog(userId: string | null = getActiveUserId(), log: NutritionLog): Promise<void> {
  if (log.date === todayKey()) writeLogCache(log, userId);

  try {
    if (!userId) {
      emit();
      return;
    }

    const { error } = await supabase.from("nutrition_logs").upsert(
      {
        user_id: userId,
        log_date: log.date,
        eaten: log.eaten ?? {},
        custom_entries: log.customEntries ?? [],
      },
      { onConflict: "user_id,log_date" },
    );

    if (error) {
      console.warn("saveLog error:", error);
    }

    emit();
  } catch (error) {
    console.warn("saveLog exception:", error);
    emit();
  }
}

export async function toggleMeal(
  userIdOrKey: string | MealKey | null = getActiveUserId(),
  keyOrEaten?: MealKey | boolean,
  maybeEaten?: boolean,
): Promise<void> {
  const userId = maybeEaten === undefined ? getActiveUserId() : userIdOrKey as string | null;
  const key = (maybeEaten === undefined ? userIdOrKey : keyOrEaten) as MealKey;
  const eaten = (maybeEaten === undefined ? keyOrEaten : maybeEaten) as boolean;
  const log = await loadNutritionLog(userId);
  log.eaten = log.eaten ?? {};
  log.eaten[key] = eaten;
  await saveNutritionLog(userId, log);
}

export async function addCustomEntry(
  userIdOrName: string | null = getActiveUserId(),
  nameOrMacros?: string | Macros,
  maybeMacros?: Macros,
): Promise<void> {
  const userId = maybeMacros === undefined ? getActiveUserId() : userIdOrName as string | null;
  const name = (maybeMacros === undefined ? userIdOrName : nameOrMacros) as string;
  const macros = (maybeMacros === undefined ? nameOrMacros : maybeMacros) as Macros;
  const log = await loadNutritionLog(userId);
  log.customEntries = log.customEntries ?? [];
  log.customEntries.push({
    id: crypto.randomUUID(),
    name: name.trim() || "Custom meal",
    macros,
    loggedAt: Date.now(),
  });
  await saveNutritionLog(userId, log);
}

export async function removeCustomEntry(
  userIdOrId: string | null = getActiveUserId(),
  maybeId?: string,
): Promise<void> {
  const userId = maybeId === undefined ? getActiveUserId() : userIdOrId as string | null;
  const id = (maybeId === undefined ? userIdOrId : maybeId) as string;
  const log = await loadNutritionLog(userId);
  log.customEntries = (log.customEntries ?? []).filter((e) => e.id !== id);
  await saveNutritionLog(userId, log);
}

export async function loadSavedMeals(): Promise<SavedMeal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_meals")
    .select("id, name, emoji, macros")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    console.warn("loadSavedMeals error:", error);
    return [];
  }

  return (data ?? []) as SavedMeal[];
}

export async function saveNewMeal(
  name: string,
  macros: Macros,
  emoji = "🍽️",
): Promise<SavedMeal> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meal: SavedMeal = {
    id: crypto.randomUUID(),
    name: name.trim(),
    macros,
    emoji,
  };

  if (user) {
    await supabase.from("saved_meals").insert({ ...meal, user_id: user.id });
    emit();
  }

  return meal;
}

export async function deleteSavedMeal(id: string): Promise<void> {
  await supabase.from("saved_meals").delete().eq("id", id);
  emit();
}

export async function logSavedMeal(
  userIdOrMeal: string | SavedMeal | null = getActiveUserId(),
  maybeMeal?: SavedMeal,
): Promise<void> {
  const userId = maybeMeal === undefined ? getActiveUserId() : userIdOrMeal as string | null;
  const meal = (maybeMeal === undefined ? userIdOrMeal : maybeMeal) as SavedMeal;
  await addCustomEntry(userId, meal.name, meal.macros);
}

const MEAL_MACROS: Record<MealKey, Macros> = {
  breakfast1: meals.breakfast.option1.macros,
  breakfast2: meals.breakfast.option2.macros,
  lunchWfh: meals.lunch.wfh.macros,
  lunchOffice: meals.lunch.office.macros,
  afternoonSnack: meals.afternoonSnack.macros,
  postWorkout: meals.postWorkout.macros,
  dinner: meals.dinner.macros,
};

export function getLoggedMacros(log: NutritionLog | null | undefined): Macros {
  const safe = log ?? emptyLog();
  const eaten = safe.eaten ?? {};
  const custom = safe.customEntries ?? [];

  const zero: Macros = { cal: 0, protein: 0, carbs: 0, fat: 0 };

  const fromMeals = (Object.keys(eaten) as MealKey[]).reduce((acc, key) => {
    if (!eaten[key]) return acc;
    const m = MEAL_MACROS[key] ?? zero;
    return {
      cal: acc.cal + m.cal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    };
  }, zero);

  const fromCustom = custom.reduce((acc, e) => {
    const m = e?.macros ?? zero;
    return {
      cal: acc.cal + (m.cal ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    };
  }, zero);

  return {
    cal: fromMeals.cal + fromCustom.cal,
    protein: fromMeals.protein + fromCustom.protein,
    carbs: fromMeals.carbs + fromCustom.carbs,
    fat: fromMeals.fat + fromCustom.fat,
  };
}

export const seedNutritionLog = seedNutritionCache;
