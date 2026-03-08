import { supabase } from "@/lib/supabaseClient";
import type { UserGoal, UserGoalStep } from "./goalTypes";

const CACHE_KEY = "cache:user_goals:v1";

// -- Cache helpers ------------------------------

function readCache(): UserGoal[] {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        return raw ? (JSON.parse(raw) as UserGoal[]) : [];
    } catch { return []; }
}

function writeCache(goals: UserGoal[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(goals));
  } catch {
    return;
  }
}

// -- Load all goals for the current user ------------------------------

export async function loadUserGoals(): Promise<UserGoal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
    
    if (error || !data) return readCache();
    
    const goals: UserGoal[] = data.map(rowToGoal);
    writeCache(goals);
    return goals;
}

export function seedUserGoals(): UserGoal[] {
    return readCache();
}

// -- Save (upsert) a single goal ------------------------------

export async function saveUserGoal(goal: UserGoal): Promise<void> {
    const cached = readCache();
    const idx = cached.findIndex((g) => g.id === goal.id);
    if (idx >= 0) cached[idx] = goal; else cached.push(goal);
    writeCache(cached);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_goals").upsert(
        goalToRow(user.id, goal),
        { onConflict: "id" }
    );
}

// -- Delete a goal ------------------------------

export async function deleteUserGoal(goalId: string): Promise<void> {
    writeCache(readCache().filter((g) => g.id !== goalId));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_goals").delete().eq("id", goalId).eq("user_id", user.id);
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
    }
}