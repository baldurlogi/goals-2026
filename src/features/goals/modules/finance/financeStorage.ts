import { readJson, writeJson } from "@/lib/storage";

export type FinanceCategoryId =
  | "rent"
  | "subscriptions"
  | "transport"
  | "groceries"
  | "gym_health"
  | "food_drinks"
  | "entertainment"
  | "other";

export type FinanceCategory = {
  id: FinanceCategoryId;
  name: string;
  budget: number;
  spent: number;
};

export type FinanceMonthState = {
  month: string; // YYYY-MM
  income: number;
  categories: FinanceCategory[];
};

export function getMonthKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shiftMonth(month: string, delta: number) {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const dt = new Date(y, m - 1 + delta, 1);
  return getMonthKey(dt);
}

export function defaultFinanceState(month: string): FinanceMonthState {
  return {
    month,
    income: 0,
    categories: [
      { id: "rent", name: "Rent", budget: 0, spent: 0 },
      { id: "subscriptions", name: "Subscriptions", budget: 0, spent: 0 },
      { id: "transport", name: "Transport", budget: 0, spent: 0 },
      { id: "groceries", name: "Groceries", budget: 0, spent: 0 },
      { id: "gym_health", name: "Gym & Health", budget: 0, spent: 0 },
      { id: "food_drinks", name: "Food & Drinks (eating out)", budget: 0, spent: 0 },
      { id: "entertainment", name: "Entertainment", budget: 0, spent: 0 },
      { id: "other", name: "Other", budget: 0, spent: 0 },
    ],
  };
}

function storageKey(goalId: string, month: string) {
  return `daily-life:finance:${goalId}:${month}`;
}

export function loadFinanceMonth(goalId: string, month: string): FinanceMonthState {
  const key = storageKey(goalId, month);
  const parsed = readJson<Partial<FinanceMonthState> | null>(key, null);
  if (!parsed) return defaultFinanceState(month);

  const base = defaultFinanceState(month);
  const categoriesById = new Map(base.categories.map((c) => [c.id, c]));

  (parsed.categories ?? []).forEach((c) => {
    if (!c?.id) return;
    const existing = categoriesById.get(c.id as FinanceCategoryId);
    if (!existing) return;
    existing.budget = Number((c as any).budget ?? existing.budget) || 0;
    existing.spent = Number((c as any).spent ?? existing.spent) || 0;
  });

  return {
    month,
    income: Number(parsed.income ?? base.income) || 0,
    categories: base.categories,
  };
}

export function saveFinanceMonth(goalId: string, state: FinanceMonthState) {
  const key = storageKey(goalId, state.month);
  writeJson(key, state);
}