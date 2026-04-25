import { supabase } from '@/lib/supabaseClient';
import { CACHE_KEYS, assertRegisteredCacheWrite } from '@/lib/cacheRegistry';
import type { UserGoal, UserGoalStep } from './goalTypes';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import { getActiveUserId, getScopedStorageItem, writeScopedStorageItem } from '@/lib/activeUser';

const CACHE_KEY = CACHE_KEYS.USER_GOALS;
const GOALS_CHANGED_EVENT = 'goals:changed';

function emitGoalsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(GOALS_CHANGED_EVENT));
}

function scopedCacheKey(userId: string) {
  return `${CACHE_KEY}:${userId}`;
}

// -- Cache helpers ------------------------------

function readScopedCache(userId: string): UserGoal[] {
  try {
    const raw = getScopedStorageItem(CACHE_KEY, userId) ?? localStorage.getItem(scopedCacheKey(userId));
    return raw ? (JSON.parse(raw) as UserGoal[]) : [];
  } catch {
    return [];
  }
}

function migrateLegacyCache(userId: string): UserGoal[] {
  if (getActiveUserId() !== userId) return [];

  try {
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

function readCache(userId: string, options?: { allowLegacyMigration?: boolean }): UserGoal[] {
  const scoped = readScopedCache(userId);
  if (scoped.length > 0) return scoped;
  if (options?.allowLegacyMigration) return migrateLegacyCache(userId);
  return scoped;
}

function writeCache(userId: string, goals: UserGoal[]): boolean {
  try {
    const key = scopedCacheKey(userId);
    assertRegisteredCacheWrite(key);
    writeScopedStorageItem(CACHE_KEY, userId, JSON.stringify(goals));
    localStorage.removeItem(CACHE_KEY);
    return true;
  } catch {
    return false;
  }
}

export type GoalPersistenceStatus = {
  localCacheWriteSucceeded: boolean;
  remoteSyncSucceeded: boolean;
  isFirstGoalCreated: boolean;
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

export class GoalSaveAuthError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "GoalSaveAuthError";
  }
}

// -- Load all goals for the current user ------------------------------

export async function loadUserGoals(userId: string | null = getActiveUserId()): Promise<UserGoal[]> {
  if (!userId) return [];

  const cached = readCache(userId, { allowLegacyMigration: true });

  try {
    const { data, error } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      if (error) {
        console.warn("loadUserGoals error:", error);
      }
      return cached;
    }

    const goals: UserGoal[] = data.map(rowToGoal);
    writeCache(userId, goals);
    return goals;
  } catch (error) {
    console.warn("loadUserGoals exception:", error);
    return cached;
  }
}

export function seedGoalCache(userId: string | null): UserGoal[] {
  if (!userId) return [];
  return readCache(userId);
}

// -- Save (upsert) a single goal ------------------------------

export async function saveUserGoal(userId: string | null, goal: UserGoal): Promise<GoalPersistenceStatus> {
  if (!userId) {
    throw new GoalSaveAuthError();
  }

  const cached = readCache(userId);
  const idx = cached.findIndex((g) => g.id === goal.id);
  const isFirstGoalCreated = idx < 0 && cached.length === 0;
  if (idx >= 0) cached[idx] = goal;
  else cached.push(goal);
  const localCacheWriteSucceeded = writeCache(userId, cached);
  if (localCacheWriteSucceeded) {
    emitGoalsChanged();
  }

  const { error } = await supabase
    .from("user_goals")
    .upsert(goalToRow(userId, goal), { onConflict: "id" });

  if (error) {
    throw new GoalRemotePersistenceError('save', localCacheWriteSucceeded);
  }

  return {
    localCacheWriteSucceeded,
    remoteSyncSucceeded: true,
    isFirstGoalCreated,
  } satisfies GoalPersistenceStatus;
}

// -- Delete a goal ------------------------------

export async function deleteUserGoal(userId: string | null, goalId: string): Promise<GoalPersistenceStatus> {
  if (!userId) {
    return {
      localCacheWriteSucceeded: false,
      remoteSyncSucceeded: false,
      isFirstGoalCreated: false,
    };
  }

  const localCacheWriteSucceeded = writeCache(
    userId,
    readCache(userId).filter((g) => g.id !== goalId),
  );
  if (localCacheWriteSucceeded) {
    emitGoalsChanged();
  }

  const { error } = await supabase
    .from("user_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    throw new GoalRemotePersistenceError('delete', localCacheWriteSucceeded);
  }

  return {
    localCacheWriteSucceeded,
    remoteSyncSucceeded: true,
    isFirstGoalCreated: false,
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
