import { supabase } from '@/lib/supabaseClient';
import { CACHE_KEYS, assertRegisteredCacheWrite } from '@/lib/cacheRegistry';
import type { UserGoal, UserGoalStep } from './goalTypes';
import { getLocalDateKey } from '@/hooks/useTodayDate';

const CACHE_KEY = CACHE_KEYS.USER_GOALS;

function scopedCacheKey(userId: string) {
  return `${CACHE_KEY}:${userId}`;
}

// -- Cache helpers ------------------------------

function readCache(userId: string): UserGoal[] {
  try {
    const scopedKey = scopedCacheKey(userId);
    const raw = localStorage.getItem(scopedKey);

    if (raw) return JSON.parse(raw) as UserGoal[];

    const legacyRaw = localStorage.getItem(CACHE_KEY);
    if (!legacyRaw) return [];

    const legacyGoals = JSON.parse(legacyRaw) as UserGoal[];
    writeCache(userId, legacyGoals);
    localStorage.removeItem(CACHE_KEY);
    return legacyGoals;
  } catch {
    return [];
  }
}

function readAnyScopedCache(): UserGoal[] {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(`${CACHE_KEY}:`)) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      return JSON.parse(raw) as UserGoal[];
    }
  } catch {
    // ignore
  }

  return [];
}

function writeCache(userId: string, goals: UserGoal[]): boolean {
  try {
    const key = scopedCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(goals));
    localStorage.removeItem(CACHE_KEY);
    return true;
  } catch {
    return false;
  }
}

export type GoalPersistenceStatus = {
  localCacheWriteSucceeded: boolean;
  remoteSyncSucceeded: boolean;
};

export class GoalRemotePersistenceError extends Error {
  readonly operation: 'save' | 'delete';
  readonly localCacheWriteSucceeded: boolean;

  constructor(operation: 'save' | 'delete', localCacheWriteSucceeded: boolean) {
    super(`Goal ${operation} failed to sync to Supabase.`);
    this.name = 'GoalRemotePersistenceError';
    this.operation = operation;
    this.localCacheWriteSucceeded = localCacheWriteSucceeded;
  }
}

// -- Load all goals for the current user ------------------------------

export async function loadUserGoals(): Promise<UserGoal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const cached = readCache(user.id);

  try {
    const { data, error } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error || !data) {
      if (error) {
        console.warn("loadUserGoals error:", error);
      }
      return cached;
    }

    const goals: UserGoal[] = data.map(rowToGoal);
    writeCache(user.id, goals);
    return goals;
  } catch (error) {
    console.warn("loadUserGoals exception:", error);
    return cached;
  }
}

export function seedUserGoals(): UserGoal[] {
  const scoped = readAnyScopedCache();
  if (scoped.length > 0) return scoped;

  try {
    const legacyRaw = localStorage.getItem(CACHE_KEY);
    return legacyRaw ? (JSON.parse(legacyRaw) as UserGoal[]) : [];
  } catch {
    return [];
  }
}

// -- Save (upsert) a single goal ------------------------------

export async function saveUserGoal(goal: UserGoal): Promise<GoalPersistenceStatus> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      localCacheWriteSucceeded: false,
      remoteSyncSucceeded: false,
    } satisfies GoalPersistenceStatus;
  }

  const cached = readCache(user.id);
  const idx = cached.findIndex((g) => g.id === goal.id);
  if (idx >= 0) cached[idx] = goal;
  else cached.push(goal);
  const localCacheWriteSucceeded = writeCache(user.id, cached);

  const { error } = await supabase
    .from("user_goals")
    .upsert(goalToRow(user.id, goal), { onConflict: "id" });

  if (error) {
    throw new GoalRemotePersistenceError('save', localCacheWriteSucceeded);
  }

  return {
    localCacheWriteSucceeded,
    remoteSyncSucceeded: true,
  } satisfies GoalPersistenceStatus;
}

// -- Delete a goal ------------------------------

export async function deleteUserGoal(goalId: string): Promise<GoalPersistenceStatus> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      localCacheWriteSucceeded: false,
      remoteSyncSucceeded: false,
    };
  }

  const localCacheWriteSucceeded = writeCache(
    user.id,
    readCache(user.id).filter((g) => g.id !== goalId),
  );

  const { error } = await supabase
    .from("user_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) {
    throw new GoalRemotePersistenceError('delete', localCacheWriteSucceeded);
  }

  return {
    localCacheWriteSucceeded,
    remoteSyncSucceeded: true,
  };
}

// -- Factory helpers ------------------------------

export function createBlankGoal(): UserGoal {
  return {
    id: crypto.randomUUID(),
    userId: "",
    title: "",
    subtitle: "",
    emoji: "🎯",
    priority: "medium",
    steps: [],
    createdAt: getLocalDateKey(),
    updatedAt: getLocalDateKey(),
  };
}

export function createBlankStep(sortOrder: number): UserGoalStep {
  return {
    id: crypto.randomUUID(),
    label: "",
    notes: "",
    idealFinish: null,
    estimatedTime: "",
    sortOrder,
  };
}

// -- Row <-> Goal conversion helpers ------------------------------

function rowToGoal(row: Record<string, unknown>): UserGoal {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    subtitle: (row.subtitle as string) ?? "",
    emoji: (row.emoji as string) ?? "🎯",
    priority: (row.priority as UserGoal["priority"]) ?? "medium",
    steps: (row.steps as UserGoalStep[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function goalToRow(userId: string, goal: UserGoal) {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    subtitle: goal.subtitle,
    emoji: goal.emoji,
    priority: goal.priority,
    steps: goal.steps,
    updated_at: getLocalDateKey(),
  };
}
