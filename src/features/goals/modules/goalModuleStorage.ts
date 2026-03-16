import { getLocalDateKey } from '@/hooks/useTodayDate';
import { storageError, storageOk, type StorageMutationResult } from '@/lib/storageResult';
import { cacheKeyBuilders, assertRegisteredCacheWrite } from '@/lib/cacheRegistry';
import { supabase } from '@/lib/supabaseClient';


export const GOAL_MODULE_CHANGED_EVENT = 'goal_module:changed';
const LOG_TAG = '[storage:goal-module]';

function emit() {
  window.dispatchEvent(new Event(GOAL_MODULE_CHANGED_EVENT));
}

function cacheKey(goalId: string, moduleKey: string) {
  return cacheKeyBuilders.goalModule(goalId, moduleKey);
}

function readCache<T>(goalId: string, moduleKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(cacheKey(goalId, moduleKey));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache<T>(goalId: string, moduleKey: string, value: T) {
  try {
    const key = cacheKey(goalId, moduleKey);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function pendingSyncKey(goalId: string, moduleKey: string) {
  return cacheKeyBuilders.goalModulePendingSync(goalId, moduleKey);
}

function markPendingSync<T>(goalId: string, moduleKey: string, state: T) {
  try {
    const key = pendingSyncKey(goalId, moduleKey);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(
      key,
      JSON.stringify({ state, updated_at: getLocalDateKey() }),
    );
  } catch {
    // ignore best-effort cache marker writes
  }
}

function clearPendingSync(goalId: string, moduleKey: string) {
  try {
    localStorage.removeItem(pendingSyncKey(goalId, moduleKey));
  } catch {
    // ignore best-effort cache marker writes
  }
}

export function seedCache<T>(
  goalId: string,
  moduleKey: string,
  fallback: T,
): T {
  return readCache(goalId, moduleKey, fallback);
}

export async function loadModuleState<T>(
  goalId: string,
  moduleKey: string,
  fallback: T,
): Promise<T> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return readCache(goalId, moduleKey, fallback);

  const { data, error } = await supabase
    .from('goal_module_state')
    .select('state')
    .eq('user_id', user.id)
    .eq('goal_id', goalId)
    .eq('module_key', moduleKey)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.warn(`${LOG_TAG} load failed, using cache`, {
        goalId,
        moduleKey,
        error: error.message,
      });
    }
    return readCache(goalId, moduleKey, fallback);
  }

  const result = data.state as T;
  writeCache(goalId, moduleKey, result);
  return result;
}

export async function saveModuleState<T>(
  goalId: string,
  moduleKey: string,
  state: T,
): Promise<StorageMutationResult> {

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    writeCache(goalId, moduleKey, state);
    markPendingSync(goalId, moduleKey, state);
    console.debug(`${LOG_TAG} user unavailable, marked pending-sync`, {
      goalId,
      moduleKey,
    });
    emit();
    return { ok: false, error: 'Not signed in. Change saved locally and marked pending sync.' };
  }

  const { error } = await supabase
    .from('goal_module_state')
    .upsert(
      {
        user_id: user.id,
        goal_id: goalId,
        module_key: moduleKey,
        state,
        updated_at: getLocalDateKey(),
      },
      { onConflict: 'user_id,goal_id,module_key' },
    );

  if (error) {
    writeCache(goalId, moduleKey, state);
    markPendingSync(goalId, moduleKey, state);
    const result = storageError(error);
    console.error(`${LOG_TAG} failed save`, {
      goalId,
      moduleKey,
      userId: user.id,
      error: result.error,
    });
    emit();
    return result;
  }

  writeCache(goalId, moduleKey, state);
  clearPendingSync(goalId, moduleKey);
  console.debug(`${LOG_TAG} save success`, { goalId, moduleKey, userId: user.id });
  emit();
  return storageOk();
}
