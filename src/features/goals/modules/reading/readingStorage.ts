import { supabase } from "@/lib/supabaseClient";

type ReadingStreakState = { lastReadISO: string | null; streak: number };

type ReadingMinutesState = {
  dayISO: string; // YYYY-MM-DD (auto-roll daily)
  minutes: number;
  target: number;
};

type BookProgressState = {
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
};

type GoalReadingState = {
  streak: ReadingStreakState;
  minutes: ReadingMinutesState;
  book: BookProgressState;
};

type ReadingStateRow = {
  state?: {
    goalModules?: {
      reading?: Record<string, Partial<GoalReadingState>>;
    };
    [key: string]: unknown;
  };
};

const ns = (goalId: string, key: string) => `goals:${goalId}:reading:${key}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function todayISO(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function diffDays(aISO: string, bISO: string) {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function defaultStreak(): ReadingStreakState {
  return { lastReadISO: null, streak: 0 };
}

function defaultMinutes(): ReadingMinutesState {
  return { dayISO: todayISO(), minutes: 0, target: 30 };
}

function defaultBook(): BookProgressState {
  return {
    title: "Current book",
    author: "",
    totalPages: 300,
    currentPage: 0,
  };
}

function defaultGoalReadingState(): GoalReadingState {
  return {
    streak: defaultStreak(),
    minutes: defaultMinutes(),
    book: defaultBook(),
  };
}

function loadLocalState(goalId: string): GoalReadingState {
  return {
    streak: safeParse(localStorage.getItem(ns(goalId, "streak")), defaultStreak()),
    minutes: safeParse(localStorage.getItem(ns(goalId, "minutes")), defaultMinutes()),
    book: safeParse(localStorage.getItem(ns(goalId, "book")), defaultBook()),
  };
}

function persistLocalState(goalId: string, state: GoalReadingState) {
  localStorage.setItem(ns(goalId, "streak"), JSON.stringify(state.streak));
  localStorage.setItem(ns(goalId, "minutes"), JSON.stringify(state.minutes));
  localStorage.setItem(ns(goalId, "book"), JSON.stringify(state.book));
}

function normalizeMinutesDay(state: GoalReadingState): GoalReadingState {
  const today = todayISO();
  if (state.minutes.dayISO === today) return state;
  return {
    ...state,
    minutes: { dayISO: today, minutes: 0, target: state.minutes.target || 30 },
  };
}

function normalizeGoalState(raw?: Partial<GoalReadingState> | null): GoalReadingState {
  const base = defaultGoalReadingState();
  return normalizeMinutesDay({
    streak: { ...base.streak, ...(raw?.streak ?? {}) },
    minutes: { ...base.minutes, ...(raw?.minutes ?? {}) },
    book: { ...base.book, ...(raw?.book ?? {}) },
  });
}

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.id ?? null;
}

async function getGoalState(goalId: string): Promise<GoalReadingState> {
  const local = normalizeGoalState(loadLocalState(goalId));

  try {
    const uid = await getUserId();
    if (!uid) return local;

    const { data, error } = await supabase
      .from("reading_state")
      .select("state")
      .eq("user_id", uid)
      .maybeSingle<ReadingStateRow>();

    if (error) throw error;

    const raw = data?.state?.goalModules?.reading?.[goalId] ?? null;
    if (!raw) return local;

    const next = normalizeGoalState(raw);
    persistLocalState(goalId, next);
    return next;
  } catch (e) {
    console.warn("Reading goal load failed; using local fallback", e);
    return local;
  }
}

async function saveGoalState(goalId: string, next: GoalReadingState): Promise<void> {
  persistLocalState(goalId, next);

  const uid = await getUserId();
  if (!uid) return;

  const { data, error } = await supabase
    .from("reading_state")
    .select("state")
    .eq("user_id", uid)
    .maybeSingle<ReadingStateRow>();

  if (error) throw error;

  const state = (data?.state ?? {}) as ReadingStateRow["state"];
  const merged = {
    ...state,
    goalModules: {
      ...(state?.goalModules ?? {}),
      reading: {
        ...(state?.goalModules?.reading ?? {}),
        [goalId]: next,
      },
    },
  };

  const { error: upsertError } = await supabase
    .from("reading_state")
    .upsert({ user_id: uid, state: merged, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (upsertError) throw upsertError;
}

// ---- streak ----
export async function getReadingStreak(goalId: string): Promise<ReadingStreakState> {
  const state = await getGoalState(goalId);
  return state.streak;
}

export async function setReadingStreak(goalId: string, next: ReadingStreakState): Promise<void> {
  const cur = await getGoalState(goalId);
  await saveGoalState(goalId, { ...cur, streak: next });
}

// ---- minutes ----
export async function getReadingMinutes(goalId: string): Promise<ReadingMinutesState> {
  const state = await getGoalState(goalId);
  return state.minutes;
}

export async function setReadingMinutes(goalId: string, next: ReadingMinutesState): Promise<void> {
  const cur = await getGoalState(goalId);
  await saveGoalState(goalId, { ...cur, minutes: normalizeGoalState({ minutes: next }).minutes });
}

// ---- book ----
export async function getBookProgress(goalId: string): Promise<BookProgressState> {
  const state = await getGoalState(goalId);
  return state.book;
}

export async function setBookProgress(goalId: string, next: BookProgressState): Promise<void> {
  const cur = await getGoalState(goalId);
  await saveGoalState(goalId, { ...cur, book: next });
}
