import { supabase } from "@/lib/supabaseClient";

export const GOAL_MODULE_CHANGED_EVENT = "goal_module:changed";
function emit() { window.dispatchEvent(new Event(GOAL_MODULE_CHANGED_EVENT)); }

function cacheKey(goalId: string, moduleKey: string) {
  return `cache:gm:${goalId}:${moduleKey}`;
}

function readCache<T>(goalId: string, moduleKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(cacheKey(goalId, moduleKey));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function writeCache<T>(goalId: string, moduleKey: string, value: T) {
  try { localStorage.setItem(cacheKey(goalId, moduleKey), JSON.stringify(value)); } catch {}
}

export function seedCache<T>(goalId: string, moduleKey: string, fallback: T): T {
  return readCache(goalId, moduleKey, fallback);
}

export async function loadModuleState<T>(goalId: string, moduleKey: string, fallback: T): Promise<T> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return readCache(goalId, moduleKey, fallback);

  const { data, error } = await supabase
    .from("goal_module_state")
    .select("state")
    .eq("user_id", user.id)
    .eq("goal_id", goalId)
    .eq("module_key", moduleKey)
    .maybeSingle();

  if (error || !data) return readCache(goalId, moduleKey, fallback);

  const result = data.state as T;
  writeCache(goalId, moduleKey, result);
  return result;
}

export async function saveModuleState<T>(goalId: string, moduleKey: string, state: T): Promise<void> {
  writeCache(goalId, moduleKey, state);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("goal_module_state")
    .upsert(
      { user_id: user.id, goal_id: goalId, module_key: moduleKey, state, updated_at: new Date().toISOString() },
      { onConflict: "user_id,goal_id,module_key" },
    );
  emit();
}