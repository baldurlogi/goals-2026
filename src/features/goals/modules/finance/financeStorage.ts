import { supabase } from "@/lib/supabaseClient";

export type FinanceCategoryId =
  | "rent" | "subscriptions" | "transport" | "groceries"
  | "gym_health" | "food_drinks" | "entertainment" | "other";

export type FinanceCategory = {
  id: FinanceCategoryId; name: string; budget: number; spent: number;
};

export type FinanceMonthState = {
  month: string; // YYYY-MM
  income: number;
  categories: FinanceCategory[];
};

export const FINANCE_CHANGED_EVENT = "finance:changed";
function emit() { window.dispatchEvent(new Event(FINANCE_CHANGED_EVENT)); }

export function getMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  return getMonthKey(dt);
}

export function defaultFinanceState(month: string): FinanceMonthState {
  return {
    month,
    income: 0,
    categories: [
      { id: "rent",          name: "Rent",                       budget: 0, spent: 0 },
      { id: "subscriptions", name: "Subscriptions",              budget: 0, spent: 0 },
      { id: "transport",     name: "Transport",                  budget: 0, spent: 0 },
      { id: "groceries",     name: "Groceries",                  budget: 0, spent: 0 },
      { id: "gym_health",    name: "Gym & Health",               budget: 0, spent: 0 },
      { id: "food_drinks",   name: "Food & Drinks (eating out)", budget: 0, spent: 0 },
      { id: "entertainment", name: "Entertainment",              budget: 0, spent: 0 },
      { id: "other",         name: "Other",                      budget: 0, spent: 0 },
    ],
  };
}

function cacheKey(goalId: string, month: string) {
  return `cache:finance:${goalId}:${month}`;
}

function readCache(goalId: string, month: string): FinanceMonthState | null {
  try {
    const raw = localStorage.getItem(cacheKey(goalId, month));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(goalId: string, state: FinanceMonthState) {
  try { localStorage.setItem(cacheKey(goalId, state.month), JSON.stringify(state)); } catch {}
}

/** Merge partial saved data onto default category scaffold */
function mergeState(month: string, saved: Partial<FinanceMonthState>): FinanceMonthState {
  const base = defaultFinanceState(month);
  const byId = new Map(base.categories.map((c) => [c.id, c]));
  for (const c of saved.categories ?? []) {
    if (!c?.id) continue;
    const existing = byId.get(c.id as FinanceCategoryId);
    if (!existing) continue;
    existing.budget = Number(c.budget ?? existing.budget) || 0;
    existing.spent  = Number(c.spent  ?? existing.spent)  || 0;
  }
  return { month, income: Number(saved.income ?? 0) || 0, categories: base.categories };
}

export async function loadFinanceMonth(goalId: string, month: string): Promise<FinanceMonthState> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return readCache(goalId, month) ?? defaultFinanceState(month);

  const { data, error } = await supabase
    .from("finance_months")
    .select("state")
    .eq("user_id", user.id)
    .eq("goal_id", goalId)
    .eq("month",   month)
    .single();

  if (error || !data) {
    return readCache(goalId, month) ?? defaultFinanceState(month);
  }

  const merged = mergeState(month, data.state as Partial<FinanceMonthState>);
  writeCache(goalId, merged);
  return merged;
}

export async function saveFinanceMonth(goalId: string, state: FinanceMonthState): Promise<void> {
  writeCache(goalId, state); // instant local update

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { emit(); return; }

  await supabase.from("finance_months").upsert(
    { user_id: user.id, goal_id: goalId, month: state.month, state },
    { onConflict: "user_id,goal_id,month" }
  );
  emit();
}