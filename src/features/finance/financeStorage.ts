import { supabase } from '@/lib/supabaseClient';
import { cacheKeyBuilders } from '@/lib/cacheRegistry';

export type FinanceCategoryId =
  | 'rent'
  | 'subscriptions'
  | 'transport'
  | 'groceries'
  | 'gym_health'
  | 'personal_care'
  | 'shopping'
  | 'food_drinks'
  | 'entertainment'
  | 'other';

export type FinanceCategory = {
  id: FinanceCategoryId;
  name: string;
  budget: number;
  spent: number;
};

export type FinanceMonthState = {
  month: string;
  income: number;
  categories: FinanceCategory[];
};

export const FINANCE_CHANGED_EVENT = 'finance:changed';

function emit() {
  window.dispatchEvent(new Event(FINANCE_CHANGED_EVENT));
}

export function getMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const dt = new Date(y, m - 1 + delta, 1);
  return getMonthKey(dt);
}

export function buildMonthRange(endMonth: string, count: number): string[] {
  return Array.from({ length: Math.max(count, 0) }, (_, index) =>
    shiftMonth(endMonth, index - (count - 1)),
  );
}

export function defaultFinanceState(month: string): FinanceMonthState {
  return {
    month,
    income: 0,
    categories: [
      { id: 'rent', name: 'Rent', budget: 0, spent: 0 },
      { id: 'subscriptions', name: 'Subscriptions', budget: 0, spent: 0 },
      { id: 'transport', name: 'Transport', budget: 0, spent: 0 },
      { id: 'groceries', name: 'Groceries', budget: 0, spent: 0 },
      { id: 'gym_health', name: 'Gym & Health', budget: 0, spent: 0 },
      { id: 'personal_care', name: 'Personal care', budget: 0, spent: 0 },
      { id: 'shopping', name: 'Shopping', budget: 0, spent: 0 },
      { id: 'food_drinks', name: 'Food & Drinks (eating out)', budget: 0, spent: 0 },
      { id: 'entertainment', name: 'Entertainment', budget: 0, spent: 0 },
      { id: 'other', name: 'Other', budget: 0, spent: 0 },
    ],
  };
}

function cacheKey(goalId: string, month: string) {
  return cacheKeyBuilders.finance(goalId, month);
}

function readCache(goalId: string, month: string): FinanceMonthState | null {
  try {
    const raw = localStorage.getItem(cacheKey(goalId, month));
    return raw
      ? normalizeFinanceMonthState(JSON.parse(raw) as Partial<FinanceMonthState>, month)
      : null;
  } catch {
    return null;
  }
}

function writeCache(goalId: string, state: FinanceMonthState) {
  try {
    localStorage.setItem(cacheKey(goalId, state.month), JSON.stringify(state));
  } catch (e) {
    console.warn('finance cache write failed', e);
  }
}

function mergeState(
  month: string,
  saved: Partial<FinanceMonthState>,
): FinanceMonthState {
  const base = defaultFinanceState(month);
  const byId = new Map(base.categories.map((c) => [c.id, c]));

  for (const c of saved.categories ?? []) {
    if (!c?.id) continue;

    const existing = byId.get(c.id as FinanceCategoryId);
    if (!existing) continue;

    existing.budget = Number(c.budget ?? existing.budget) || 0;
    existing.spent = Number(c.spent ?? existing.spent) || 0;
  }

  return {
    month,
    income: Number(saved.income ?? 0) || 0,
    categories: base.categories,
  };
}

export function normalizeFinanceMonthState(
  saved: Partial<FinanceMonthState> | null | undefined,
  fallbackMonth: string,
): FinanceMonthState {
  const month =
    typeof saved?.month === 'string' && saved.month.trim().length > 0
      ? saved.month
      : fallbackMonth;

  return mergeState(month, saved ?? {});
}

export async function loadFinanceMonth(
  goalId: string,
  month: string,
): Promise<FinanceMonthState> {
  const cached = readCache(goalId, month);
  if (cached) {
    writeCache(goalId, cached);
    return cached;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return defaultFinanceState(month);

  const { data, error } = await supabase
    .from('finance_months')
    .select('state')
    .eq('user_id', user.id)
    .eq('goal_id', goalId)
    .eq('month', month)
    .maybeSingle();

  if (error || !data) {
    return defaultFinanceState(month);
  }

  const merged = mergeState(month, data.state as Partial<FinanceMonthState>);
  writeCache(goalId, merged);
  return merged;
}

export async function loadFinanceHistory(
  goalId: string,
  endMonth: string,
  count = 6,
): Promise<FinanceMonthState[]> {
  const months = buildMonthRange(endMonth, count);
  const seeded = months.map((month) => readCache(goalId, month) ?? defaultFinanceState(month));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return seeded;

  const startMonth = months[0];
  if (!startMonth) return seeded;

  const { data, error } = await supabase
    .from('finance_months')
    .select('month, state')
    .eq('user_id', user.id)
    .eq('goal_id', goalId)
    .gte('month', startMonth)
    .lte('month', endMonth)
    .order('month', { ascending: true });

  if (error || !data) {
    return seeded;
  }

  const byMonth = new Map(seeded.map((item) => [item.month, item]));

  for (const row of data) {
    const month = typeof row.month === 'string' && row.month.trim().length > 0
      ? row.month
      : endMonth;
    const merged = mergeState(month, (row.state as Partial<FinanceMonthState>) ?? {});
    writeCache(goalId, merged);
    byMonth.set(month, merged);
  }

  return months.map((month) => byMonth.get(month) ?? defaultFinanceState(month));
}

export async function saveFinanceMonth(
  goalId: string,
  state: FinanceMonthState,
): Promise<void> {
  const normalized = normalizeFinanceMonthState(state, state.month);
  writeCache(goalId, normalized);
  emit();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('finance_months').upsert(
    { user_id: user.id, goal_id: goalId, month: normalized.month, state: normalized },
    { onConflict: 'user_id,goal_id,month' },
  );
}
