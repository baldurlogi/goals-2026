import { supabase } from '@/lib/supabaseClient';
import { CACHE_KEYS, assertRegisteredCacheWrite } from '@/lib/cacheRegistry';
import type { UserGoal, UserGoalStep } from './goalTypes';
import { getLocalDateKey } from '@/hooks/useTodayDate';

const CACHE_KEY = CACHE_KEYS.USER_GOALS;

// -- Cache helpers ------------------------------

function readCache(): UserGoal[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserGoal[]) : [];
  } catch {
    return [];
  }
}

function writeCache(goals: UserGoal[]): boolean {
  try {
    assertRegisteredCacheWrite(CACHE_KEY);
    localStorage.setItem(CACHE_KEY, JSON.stringify(goals));
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
  const cached = readCache();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return cached;

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
    writeCache(goals);
    return goals;
  } catch (error) {
    console.warn("loadUserGoals exception:", error);
    return cached;
  }
}

export function seedUserGoals(): UserGoal[] {
  return readCache();
}

// -- Save (upsert) a single goal ------------------------------

export async function saveUserGoal(goal: UserGoal): Promise<GoalPersistenceStatus> {
  const cached = readCache();
  const idx = cached.findIndex((g) => g.id === goal.id);
  if (idx >= 0) cached[idx] = goal;
  else cached.push(goal);
  const localCacheWriteSucceeded = writeCache(cached);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      localCacheWriteSucceeded,
      remoteSyncSucceeded: false,
    } satisfies GoalPersistenceStatus;
  }

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
  const localCacheWriteSucceeded = writeCache(
    readCache().filter((g) => g.id !== goalId),
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      localCacheWriteSucceeded,
      remoteSyncSucceeded: false,
    };
  }

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
