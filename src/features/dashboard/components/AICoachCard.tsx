import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabaseFunctionUrl, supabase } from "@/lib/supabaseClient";
import { buildAIContext } from "@/features/ai/buildAIContext";
import { buildAIRetrievalContext } from "@/features/ai/retrievedAIContext";
import { buildAISignals } from "@/features/ai/aiSignals";
import {
  buildSuggestionCandidateActionKey,
  buildSuggestionCandidates,
} from "@/features/ai/suggestionCandidates";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { AIUsageLimitNotice } from "@/features/subscription/AIUsageLimitNotice";
import { writeAIUsageCache } from "@/features/subscription/aiUsageCache";
import {
  AI_ACTION_CREDIT_COSTS,
  coerceAIUsage,
} from "@/features/subscription/aiCredits";
import { READING_CHANGED_EVENT } from "@/features/reading/readingStorage";
import { WATER_CHANGED_EVENT } from "@/features/water/waterStorage";
import { SCHEDULE_CHANGED_EVENT } from "@/features/schedule/scheduleStorage";
import { FITNESS_CHANGED_EVENT } from "@/features/fitness/constants";
import { SLEEP_CHANGED_EVENT } from "@/features/sleep/sleepStorage";
import { WELLBEING_CHANGED_EVENT } from "@/features/wellbeing/wellbeingStorage";
import { capture } from "@/lib/analytics";
import {
  getScopedStorageItem,
  removeScopedStorageItem,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import { useAuth } from "@/features/auth/authContext";
import { GOAL_MODULE_CHANGED_EVENT } from "@/lib/goalModuleStorage";
import { getLocalDateKey } from "@/hooks/useTodayDate";
// ── Types ────────────────────────────────────────────────────────────────────

type CoachSuggestion = {
  action: string;
  reason: string;
  href: string;
  emoji: string;
  module?: string;
};

type CacheEntry = {
  suggestion: CoachSuggestion;
  builtAt: number;
};

type CompletedSuggestionEntry = {
  suggestion: CoachSuggestion;
  completedAt: number;
  date: string;
};

class AIUsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIUsageLimitError";
  }
}

const CACHE_KEY        = "cache:ai-coach:v2";
const LAST_MODULE_KEY  = "cache:ai-coach:last-module";
const LAST_SESSION_KEY = "cache:ai-coach:last-session:v1";
const COMPLETED_SUGGESTION_KEY = "cache:ai-coach:completed:v1";
const DEFERRED_GOAL_SUGGESTIONS_KEY = "cache:ai-coach:deferred-goals:v1";
const CACHE_TTL        = 60 * 60 * 1000;
const SUPABASE_FN      = getSupabaseFunctionUrl("hyper-responder");

type DayPhase = "morning" | "afternoon" | "evening";

function getDayPhase(): DayPhase {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function getPhaseLabel(phase: DayPhase) {
  if (phase === "morning") return "morning read";
  if (phase === "afternoon") return "midday read";
  return "evening read";
}

function getPhaseCoachFrame(phase: DayPhase) {
  if (phase === "morning") {
    return {
      title: "Recovery, hydration, and first focus are shaping this recommendation.",
      tone: "from-amber-500/10 via-violet-500/5 to-cyan-500/8",
    };
  }

  if (phase === "afternoon") {
    return {
      title: "Energy, nutrition timing, and open loops are the active signals.",
      tone: "from-violet-500/10 via-emerald-500/5 to-sky-500/8",
    };
  }

  return {
    title: "Tonight is about closing cleanly without overreaching.",
    tone: "from-indigo-500/10 via-fuchsia-500/5 to-rose-500/8",
  };
}

function getModuleGlow(module?: string) {
  switch (module) {
    case "sleep":
      return "shadow-[0_22px_70px_rgba(99,102,241,0.22)]";
    case "wellbeing":
      return "shadow-[0_22px_70px_rgba(236,72,153,0.18)]";
    case "nutrition":
      return "shadow-[0_22px_70px_rgba(249,115,22,0.18)]";
    case "fitness":
      return "shadow-[0_22px_70px_rgba(139,92,246,0.20)]";
    case "goals":
    case "todos":
      return "shadow-[0_22px_70px_rgba(244,63,94,0.16)]";
    case "schedule":
      return "shadow-[0_22px_70px_rgba(14,165,233,0.17)]";
    default:
      return "shadow-[0_22px_70px_rgba(124,58,237,0.16)]";
  }
}

function getCoachStateLabel(
  suggestion: CoachSuggestion | null,
  loading: boolean,
  isCompleted: boolean,
) {
  if (loading) return "sensing";
  if (isCompleted) return "momentum secured";
  if (suggestion?.module === "sleep") return "recovery-aware";
  if (suggestion?.module === "nutrition") return "timing-aware";
  if (suggestion?.module === "goals" || suggestion?.module === "todos") return "momentum-aware";
  if (suggestion?.module === "wellbeing") return "emotion-aware";
  return "context-aware";
}

function getCompanionInsight(suggestion: CoachSuggestion | null, phase: DayPhase, isCompleted: boolean) {
  if (isCompleted) return "Momentum is secure. The next move can stay quiet for now.";
  if (!suggestion) return getPhaseCoachFrame(phase).title;

  if (suggestion.module === "sleep") return "Recovery is setting the pace.";
  if (suggestion.module === "nutrition") return "Timing is the useful signal right now.";
  if (suggestion.module === "goals") return "This protects goal momentum before it fades.";
  if (suggestion.module === "todos") return "One closed loop will reduce mental load.";
  if (suggestion.module === "wellbeing") return "Your state matters more than output here.";
  if (phase === "evening") return "This should make tomorrow lighter.";
  return "This is the cleanest next move in the current state.";
}

function getSignalChip(suggestion: CoachSuggestion | null, phase: DayPhase, isCompleted: boolean) {
  if (isCompleted) return "Momentum stable";
  if (!suggestion) return phase === "morning" ? "Morning read" : phase === "afternoon" ? "Midday read" : "Evening read";
  if (suggestion.module === "sleep") return "Recovery-aware";
  if (suggestion.module === "nutrition") return "Recommended now";
  if (suggestion.module === "goals" || suggestion.module === "todos") return "High impact";
  if (suggestion.module === "wellbeing") return "State-aware";
  return "Best next";
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

function readCache(): CoachSuggestion | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.builtAt > CACHE_TTL) return null;
    return entry.suggestion;
  } catch { return null; }
}

function writeCache(suggestion: CoachSuggestion) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ suggestion, builtAt: Date.now() }));
    if (suggestion.module) localStorage.setItem(LAST_MODULE_KEY, suggestion.module);
  } catch { /* storage full */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

function readLastModule(): string | null {
  try { return localStorage.getItem(LAST_MODULE_KEY); } catch { return null; }
}

type LastSession = { date: string; goalId: string; goalTitle: string; stepLabel: string };
type DeferredGoalSuggestionsEntry = { date: string; actionKeys: string[] };

function readLastSession(): LastSession | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastSession;
  } catch { return null; }
}

function suggestionSignature(suggestion: CoachSuggestion): string {
  return [
    suggestion.action.trim().toLowerCase(),
    suggestion.reason.trim().toLowerCase(),
    suggestion.href.trim().toLowerCase(),
    (suggestion.module ?? "").trim().toLowerCase(),
  ].join("::");
}

function suggestionActionKey(suggestion: CoachSuggestion): string {
  return [
    suggestion.action.trim().toLowerCase(),
    suggestion.href.trim().toLowerCase(),
    (suggestion.module ?? "").trim().toLowerCase(),
  ].join("::");
}

function isOverdueGoalSuggestion(suggestion: CoachSuggestion | null): boolean {
  if (!suggestion) return false;

  return (
    suggestion.module === "goals" &&
    suggestion.href === "/app/goals" &&
    suggestion.reason.trim().toLowerCase().startsWith("overdue step for")
  );
}

function readDeferredGoalSuggestionKeys(userId: string | null): Set<string> {
  if (!userId) return new Set();

  try {
    const raw = getScopedStorageItem(DEFERRED_GOAL_SUGGESTIONS_KEY, userId);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as Partial<DeferredGoalSuggestionsEntry>;
    const today = getLocalDateKey();

    if (
      !parsed ||
      parsed.date !== today ||
      !Array.isArray(parsed.actionKeys)
    ) {
      return new Set();
    }

    return new Set(
      parsed.actionKeys.filter((value): value is string => typeof value === "string" && value.length > 0),
    );
  } catch {
    return new Set();
  }
}

function writeDeferredGoalSuggestionKeys(
  userId: string | null,
  actionKeys: Set<string>,
): void {
  if (!userId) return;

  try {
    writeScopedStorageItem(
      DEFERRED_GOAL_SUGGESTIONS_KEY,
      userId,
      JSON.stringify({
        date: getLocalDateKey(),
        actionKeys: [...actionKeys],
      } satisfies DeferredGoalSuggestionsEntry),
    );
  } catch {
    // ignore storage failures
  }
}

function readCompletedSuggestion(userId: string | null): CompletedSuggestionEntry | null {
  if (!userId) return null;

  try {
    const raw = getScopedStorageItem(COMPLETED_SUGGESTION_KEY, userId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CompletedSuggestionEntry>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.suggestion ||
      typeof parsed.completedAt !== "number"
    ) {
      return null;
    }

    const suggestion = parsed.suggestion as CoachSuggestion;
    if (!suggestion.action || !suggestion.href || !suggestion.reason || !suggestion.emoji) {
      return null;
    }

    const date = typeof parsed.date === "string"
      ? parsed.date
      : getLocalDateKey(new Date(parsed.completedAt));

    if (date !== getLocalDateKey()) {
      removeScopedStorageItem(COMPLETED_SUGGESTION_KEY, userId);
      return null;
    }

    return {
      suggestion,
      completedAt: parsed.completedAt,
      date,
    };
  } catch {
    return null;
  }
}

function writeCompletedSuggestion(userId: string | null, suggestion: CoachSuggestion) {
  if (!userId) return;

  try {
    writeScopedStorageItem(
      COMPLETED_SUGGESTION_KEY,
      userId,
      JSON.stringify({
        suggestion,
        completedAt: Date.now(),
        date: getLocalDateKey(),
      } satisfies CompletedSuggestionEntry),
    );
  } catch {
    // ignore storage failures
  }
}

function clearCompletedSuggestion(userId: string | null) {
  if (!userId) return;

  try {
    removeScopedStorageItem(COMPLETED_SUGGESTION_KEY, userId);
  } catch {
    // ignore storage failures
  }
}

function isCompletedSuggestionFresh(entry: CompletedSuggestionEntry | null): entry is CompletedSuggestionEntry {
  return Boolean(entry && entry.date === getLocalDateKey());
}

// ── Fetch from edge function ──────────────────────────────────────────────────

function buildAlternativeSuggestion(
  signals: Awaited<ReturnType<typeof buildAISignals>>,
  blockedSignatures: string[],
  deferredActionKeys: ReadonlySet<string> = new Set(),
): CoachSuggestion | null {
  const blocked = new Set(blockedSignatures);
  const lastSuggestedModule = readLastModule();

  const starter = buildStarterSuggestion(signals);
  if (starter && !blocked.has(suggestionSignature(starter))) {
    return starter;
  }

  const candidates = buildSuggestionCandidates(signals, { deferredActionKeys });
  const sortedCandidates = [...candidates].sort((left, right) => right.priority - left.priority);
  const topPriority = sortedCandidates[0]?.priority ?? 0;
  const preferredCandidates =
    lastSuggestedModule
      ? sortedCandidates.filter(
          (candidate) =>
            candidate.module !== lastSuggestedModule &&
            topPriority - candidate.priority <= 8,
        )
      : [];

  for (const candidate of [...preferredCandidates, ...sortedCandidates]) {
    const nextSuggestion = candidateToCoachSuggestion(candidate);
    if (!blocked.has(suggestionSignature(nextSuggestion))) {
      return nextSuggestion;
    }
  }

  return null;
}

async function fetchCoachSuggestion(
  avoidSignature?: string | null,
  deferredActionKeys: ReadonlySet<string> = new Set(),
): Promise<CoachSuggestion> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) throw new Error("Not signed in");

  const { systemContext, signals } = await buildAIContext(true);
  const retrievedContext = await buildAIRetrievalContext(
    "daily coach next best action",
    {
      purpose: "coach",
    },
  ).catch(() => "");
  const userContext = [systemContext, retrievedContext]
    .filter((value) => value.trim())
    .join("\n\n");
  const lastSuggestedModule = readLastModule();

  const res = await fetch(SUPABASE_FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action: "coach",
      userContext,
      lastSuggestedModule,
    }),
  });

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    if (data.error === "rate_limit_exceeded") {
      throw new Error(data.message ?? "Too many requests. Please wait a moment.");
    }
    throw new AIUsageLimitError(
      data.message ?? "Monthly AI credit limit reached. Your balance resets on the 1st.",
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch suggestion");
  }

  const data = await res.json();

  if (data.usage) {
    const usage = coerceAIUsage(data.usage, {
      credits_used: AI_ACTION_CREDIT_COSTS.coachSuggestion,
      monthly_limit: 1000,
      remaining: 1000 - AI_ACTION_CREDIT_COSTS.coachSuggestion,
      tier: "free",
      credits_cost: AI_ACTION_CREDIT_COSTS.coachSuggestion,
    });
    writeAIUsageCache(usage);
    capture("ai_credits_used", {
      feature: "coach_refresh",
      source: "ai_coach_card",
      route: window.location.pathname,
      credits_used: usage.credits_used,
      monthly_limit: usage.monthly_limit,
      remaining: usage.remaining,
      credits_cost: usage.credits_cost ?? AI_ACTION_CREDIT_COSTS.coachSuggestion,
      tier: usage.tier,
    });
  }

  const s = data.suggestion as CoachSuggestion;
  if (!s?.action || !s?.href) throw new Error("Invalid suggestion shape");

  const normalized = normalizeCoachSuggestion(s, signals, deferredActionKeys);
  if (avoidSignature && suggestionSignature(normalized) === avoidSignature) {
    return buildAlternativeSuggestion(signals, [avoidSignature], deferredActionKeys) ?? normalized;
  }

  return normalized;
}

// ── Starter + static suggestion builders ─────────────────────────────────────

function buildStarterSuggestion(signals: Awaited<ReturnType<typeof buildAISignals>>): CoachSuggestion | null {
  if (signals.modules.includes("goals") && signals.goals.count === 0) {
    return { action: "Define one anchor goal", reason: "Your coach needs a clear north star before it can predict useful next moves.", href: "/app/goals", emoji: "🎯", module: "goals" };
  }
  if (signals.modules.includes("reading") && !signals.reading.currentBookTitle) {
    return { action: "Tell me what you are reading", reason: "A current book gives the coach a quiet daily momentum signal.", href: "/app/reading", emoji: "📖", module: "reading" };
  }
  if (signals.modules.includes("fitness") && signals.fitness.daysSinceWorkout === null && !signals.fitness.strongestLift && !signals.fitness.weakestLift) {
    return { action: "Choose one strength benchmark", reason: "One baseline lets your coach spot effort, recovery, and progress patterns.", href: "/app/fitness", emoji: "💪", module: "fitness" };
  }
  if (signals.modules.includes("nutrition") && signals.nutrition.mealsLoggedToday === 0) {
    return { action: "Give today a nutrition signal", reason: "You usually make better decisions once the first meal in.", href: "/app/nutrition", emoji: "🥗", module: "nutrition" };
  }
  if (signals.modules.includes("sleep") && !signals.sleep.lastLogDate) {
    return { action: "Add last night's recovery read", reason: "Without sleep context, every productivity recommendation is partly guessing.", href: "/app/sleep", emoji: "😴", module: "sleep" };
  }
  if (signals.modules.includes("wellbeing") && !signals.wellbeing.lastLogDate) {
    return { action: "Name your current state", reason: "Mood and stress change what a humane next move should be.", href: "/app/wellbeing", emoji: "💚", module: "wellbeing" };
  }
  if (signals.modules.includes("schedule") && signals.schedule?.totalBlocks === 0) {
    return { action: "Place one anchor block", reason: "A single planned block gives the day shape without over-planning it.", href: "/app/schedule", emoji: "📅", module: "schedule" };
  }
  return null;
}

function candidateToCoachSuggestion(
  candidate: ReturnType<typeof buildSuggestionCandidates>[number],
): CoachSuggestion {
  const EMOJI: Record<string, string> = {
    goals: "🎯",
    reading: "📖",
    nutrition: "🥗",
    fitness: "💪",
    todos: "✅",
    schedule: "📅",
    sleep: "😴",
    wellbeing: "💚",
    skincare: "✨",
  };

  return {
    action: candidate.action,
    reason: candidate.reason,
    href: candidate.href,
    emoji: EMOJI[candidate.module] ?? "💡",
    module: candidate.module,
  };
}

function isMealLoggingSuggestion(suggestion: CoachSuggestion): boolean {
  const text = `${suggestion.action} ${suggestion.reason}`.toLowerCase();
  return (
    suggestion.module === "nutrition" &&
    suggestion.href === "/app/nutrition" &&
    text.includes("log") &&
    (text.includes("meal") ||
      text.includes("breakfast") ||
      text.includes("lunch") ||
      text.includes("snack") ||
      text.includes("dinner"))
  );
}

function getExpectedNutritionTimingSuggestion(
  signals: Awaited<ReturnType<typeof buildAISignals>>,
): CoachSuggestion | null {
  const meals = signals.nutrition.mealsLoggedToday;
  if (meals >= 4) return null;

  const hour = new Date().getHours();
  const mealWindows = [
    { dueFrom: 6, action: "Log breakfast", reason: "0 of 4 meals logged today." },
    { dueFrom: 13, action: "Log lunch", reason: "1 of 4 meals logged today." },
    {
      dueFrom: 17,
      action: "Log your afternoon snack",
      reason: "2 of 4 meals logged today.",
    },
    { dueFrom: 21, action: "Log dinner", reason: "3 of 4 meals logged today." },
  ] as const;

  const nextMeal = mealWindows[meals];
  if (!nextMeal || hour < nextMeal.dueFrom) return null;

  return {
    action:
      meals === 0
        ? "Give today its first nutrition signal"
        : nextMeal.action,
    reason:
      meals === 0
        ? "You usually need one food datapoint before the day becomes predictable."
        : nextMeal.reason,
    href: "/app/nutrition",
    emoji: meals === 0 ? "🥗" : "🍽️",
    module: "nutrition",
  };
}

function normalizeCoachSuggestion(
  suggestion: CoachSuggestion,
  signals: Awaited<ReturnType<typeof buildAISignals>>,
  deferredActionKeys: ReadonlySet<string> = new Set(),
): CoachSuggestion {
  const candidates = buildSuggestionCandidates(signals, { deferredActionKeys });
  const topCandidate = candidates[0] ?? null;
  const topPriority = topCandidate?.priority ?? 0;
  const lastSuggestedModule = readLastModule();
  const urgentGoalCandidate =
    topCandidate && topCandidate.module === "goals" && topPriority >= 86
      ? candidateToCoachSuggestion(topCandidate)
      : null;

  if (urgentGoalCandidate && suggestion.module !== "goals") {
    return urgentGoalCandidate;
  }

  const expectedNutritionSuggestion = getExpectedNutritionTimingSuggestion(signals);
  if (isMealLoggingSuggestion(suggestion)) {
    if (expectedNutritionSuggestion) {
      const normalizedAction = suggestion.action.trim().toLowerCase();
      const expectedAction = expectedNutritionSuggestion.action.trim().toLowerCase();
      if (normalizedAction !== expectedAction) {
        return urgentGoalCandidate ?? expectedNutritionSuggestion;
      }
    } else {
      return urgentGoalCandidate ?? candidateToCoachSuggestion(topCandidate ?? {
        module: "goals",
        priority: 10,
        action: "Review your upcoming tasks",
        reason: "A quick scan helps you choose the next meaningful step.",
        href: "/app/upcoming",
        icon: Zap,
      });
    }
  }

  if (
    urgentGoalCandidate &&
    suggestion.module === "goals" &&
    topCandidate &&
    suggestion.action.trim().toLowerCase() !== topCandidate.action.trim().toLowerCase()
  ) {
    return urgentGoalCandidate;
  }

  if (suggestion.module && suggestion.module === lastSuggestedModule) {
    const alternativeCandidate = candidates.find(
      (candidate) =>
        candidate.module !== lastSuggestedModule &&
        topPriority - candidate.priority <= 8,
    );

    if (alternativeCandidate) {
      return candidateToCoachSuggestion(alternativeCandidate);
    }
  }

  return suggestion;
}

function buildCurrentSuggestionActionKeys(
  signals: Awaited<ReturnType<typeof buildAISignals>>,
  deferredActionKeys: ReadonlySet<string> = new Set(),
): Set<string> {
  const keys = new Set<string>();
  const starter = buildStarterSuggestion(signals);
  if (starter) {
    keys.add(suggestionActionKey(starter));
  }

  const candidates = buildSuggestionCandidates(signals, { deferredActionKeys });
  for (const candidate of candidates) {
    keys.add(suggestionActionKey(candidateToCoachSuggestion(candidate)));
  }

  return keys;
}

function getNutritionCompletionThreshold(action: string): number {
  const normalized = action.toLowerCase();
  if (normalized.includes("dinner")) return 4;
  if (normalized.includes("snack")) return 3;
  if (normalized.includes("lunch")) return 2;
  return 1;
}

async function shouldAutoCompleteSuggestion(
  suggestion: CoachSuggestion | null,
  deferredActionKeys: ReadonlySet<string> = new Set(),
): Promise<boolean> {
  if (!suggestion) return false;

  const signals = await buildAISignals(true);

  if (suggestion.module === "nutrition") {
    return signals.nutrition.mealsLoggedToday >= getNutritionCompletionThreshold(suggestion.action);
  }

  if (suggestion.module === "sleep") {
    return signals.sleep.loggedToday;
  }

  if (suggestion.module === "wellbeing") {
    return signals.wellbeing.loggedToday || signals.wellbeing.journaledToday;
  }

  if (suggestion.module === "schedule") {
    return (signals.schedule?.totalBlocks ?? 0) > 0;
  }

  if (suggestion.module === "reading") {
    return Boolean(signals.reading.currentBookTitle);
  }

  if (suggestion.module === "fitness") {
    return signals.fitness.daysSinceWorkout === 0 ||
      Boolean(signals.fitness.strongestLift || signals.fitness.weakestLift);
  }

  const currentActionKeys = buildCurrentSuggestionActionKeys(signals, deferredActionKeys);

  return !currentActionKeys.has(suggestionActionKey(suggestion));
}

async function buildStaticSuggestion(
  blockedSignatures: string[] = [],
  deferredActionKeys: ReadonlySet<string> = new Set(),
): Promise<CoachSuggestion> {
  const signals = await buildAISignals(true);
  const alternate = buildAlternativeSuggestion(signals, blockedSignatures, deferredActionKeys);
  if (alternate) return alternate;

  const candidates = buildSuggestionCandidates(signals, { deferredActionKeys });
  const top = candidates[0];

  if (!top) {
    return { action: "Review your goals", reason: "Start with one goal so your coach can suggest the best next move.", href: "/app/goals", emoji: "🎯", module: "goals" };
  }

  const EMOJI: Record<string, string> = {
    goals: "🎯",
    reading: "📖",
    nutrition: "🥗",
    fitness: "💪",
    todos: "✅",
    schedule: "📅",
    sleep: "😴",
    wellbeing: "💚",
    skincare: "✨",
  };

  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const session = readLastSession();
  const reason = session?.date === yesterday && top.module === "goals" && session.goalId
    ? `You were working on "${session.goalTitle}" yesterday — keep the momentum going.`
    : top.reason;

  return normalizeCoachSuggestion(
    { action: top.action, reason, href: top.href, emoji: EMOJI[top.module] ?? "💡", module: top.module },
    signals,
    deferredActionKeys,
  );
}

// ── Card inner ────────────────────────────────────────────────────────────────

function AICoachCardInner() {
  const { userId, authReady } = useAuth();
  const phase = getDayPhase();
  const phaseFrame = getPhaseCoachFrame(phase);
  const [suggestion, setSuggestion] = useState<CoachSuggestion | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [limitHit, setLimitHit]     = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [completedSuggestion, setCompletedSuggestion] =
    useState<CompletedSuggestionEntry | null>(() => readCompletedSuggestion(userId));

  const isCompleted =
    Boolean(
      suggestion &&
      completedSuggestion &&
      suggestionSignature(suggestion) ===
        suggestionSignature(completedSuggestion.suggestion),
    );
  const coachStateLabel = getCoachStateLabel(suggestion, loading, isCompleted);
  const companionInsight = getCompanionInsight(suggestion, phase, isCompleted);
  const signalChip = getSignalChip(suggestion, phase, isCompleted);

  const loadStatic = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLimitHit(false);
    setLimitMessage(null);
    try {
      const deferredActionKeys = readDeferredGoalSuggestionKeys(userId);
      const s = await buildStaticSuggestion([], deferredActionKeys);
      setSuggestion(s);
    } catch (e) {
      const cached = readCache();
      if (cached) { setSuggestion(cached); }
      else { setError(e instanceof Error ? e.message : "Something went wrong"); }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadAI = useCallback(async (avoidSignature?: string | null) => {
    clearCompletedSuggestion(userId);
    setCompletedSuggestion(null);
    setLoading(true);
    setError(null);
    setLimitHit(false);
    setLimitMessage(null);
    try {
      const deferredActionKeys = readDeferredGoalSuggestionKeys(userId);
      const s = await fetchCoachSuggestion(avoidSignature, deferredActionKeys);
      writeCache(s);
      setSuggestion(s);
    } catch (e) {
      if (e instanceof AIUsageLimitError) {
        setLimitHit(true);
        setLimitMessage(e.message);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const syncCompletionFromLiveState = useCallback(async () => {
    if (!authReady || !userId || !suggestion || completedSuggestion) return;

    try {
      const deferredActionKeys = readDeferredGoalSuggestionKeys(userId);
      const isAutoCompleted = await shouldAutoCompleteSuggestion(suggestion, deferredActionKeys);
      if (!isAutoCompleted) return;

      writeCompletedSuggestion(userId, suggestion);
      setCompletedSuggestion({
        suggestion,
        completedAt: Date.now(),
        date: getLocalDateKey(),
      });
    } catch {
      // ignore signal refresh failures
    }
  }, [authReady, completedSuggestion, suggestion, userId]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    const storedCompletedSuggestion =
      readCompletedSuggestion(userId) ??
      (isCompletedSuggestionFresh(completedSuggestion) ? completedSuggestion : null);

    if (storedCompletedSuggestion) {
      let cancelled = false;

      void (async () => {
        const deferredActionKeys = readDeferredGoalSuggestionKeys(userId);
        const stillCompleted = await shouldAutoCompleteSuggestion(
          storedCompletedSuggestion.suggestion,
          deferredActionKeys,
        );
        if (cancelled) return;

        if (stillCompleted) {
          if (!completedSuggestion) {
            setCompletedSuggestion(storedCompletedSuggestion);
          }
          setSuggestion(storedCompletedSuggestion.suggestion);
          setLoading(false);
          return;
        }

        clearCompletedSuggestion(userId);
        setCompletedSuggestion(null);
        void loadStatic();
      })();

      return () => {
        cancelled = true;
      };
    }

    void loadStatic();
    const handleReadingChanged = () => { clearCache(); void loadStatic(); };
    const handleCoachRelevantChange = () => { clearCache(); void loadStatic(); };
    window.addEventListener(READING_CHANGED_EVENT, handleReadingChanged);
    window.addEventListener(SLEEP_CHANGED_EVENT, handleCoachRelevantChange);
    window.addEventListener(WELLBEING_CHANGED_EVENT, handleCoachRelevantChange);
    return () => {
      window.removeEventListener(READING_CHANGED_EVENT, handleReadingChanged);
      window.removeEventListener(SLEEP_CHANGED_EVENT, handleCoachRelevantChange);
      window.removeEventListener(WELLBEING_CHANGED_EVENT, handleCoachRelevantChange);
    };
  }, [authReady, completedSuggestion, loadStatic, userId]);

  useEffect(() => {
    if (!authReady) return;
    setCompletedSuggestion(readCompletedSuggestion(userId));
  }, [authReady, userId]);

  useEffect(() => {
    void syncCompletionFromLiveState();
  }, [syncCompletionFromLiveState]);

  useEffect(() => {
    if (!authReady || completedSuggestion) return;

    const sync = () => {
      void syncCompletionFromLiveState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    };

    window.addEventListener("focus", sync);
    window.addEventListener(READING_CHANGED_EVENT, sync);
    window.addEventListener(WATER_CHANGED_EVENT, sync);
    window.addEventListener(SCHEDULE_CHANGED_EVENT, sync);
    window.addEventListener(FITNESS_CHANGED_EVENT, sync);
    window.addEventListener(SLEEP_CHANGED_EVENT, sync);
    window.addEventListener(WELLBEING_CHANGED_EVENT, sync);
    window.addEventListener(GOAL_MODULE_CHANGED_EVENT, sync);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener(READING_CHANGED_EVENT, sync);
      window.removeEventListener(WATER_CHANGED_EVENT, sync);
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
      window.removeEventListener(FITNESS_CHANGED_EVENT, sync);
      window.removeEventListener(SLEEP_CHANGED_EVENT, sync);
      window.removeEventListener(WELLBEING_CHANGED_EVENT, sync);
      window.removeEventListener(GOAL_MODULE_CHANGED_EVENT, sync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authReady, completedSuggestion, syncCompletionFromLiveState]);

  function handleRefresh() {
    if (suggestion && isOverdueGoalSuggestion(suggestion)) {
      const nextDeferredKeys = readDeferredGoalSuggestionKeys(userId);
      nextDeferredKeys.add(
        buildSuggestionCandidateActionKey({
          action: suggestion.action,
          href: suggestion.href,
          module: "goals",
        }),
      );
      writeDeferredGoalSuggestionKeys(userId, nextDeferredKeys);
    }

    clearCache();
    clearCompletedSuggestion(userId);
    setCompletedSuggestion(null);
    void loadAI(suggestion ? suggestionSignature(suggestion) : null);
  }

  function handleMarkCompleted() {
    if (!suggestion || !userId) return;
    writeCompletedSuggestion(userId, suggestion);
    setCompletedSuggestion({
      suggestion,
      completedAt: Date.now(),
      date: getLocalDateKey(),
    });
  }

  function handleGenerateNextMove() {
    clearCache();
    clearCompletedSuggestion(userId);
    setCompletedSuggestion(null);
    void loadAI();
  }

  return (
    <Card
      className={[
        "ai-companion-surface relative gap-0 overflow-hidden border-0 bg-transparent py-0 transition-all duration-700 lg:col-span-12",
        getModuleGlow(suggestion?.module),
      ].join(" ")}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${phaseFrame.tone} opacity-55 transition-opacity duration-700`} />

      <CardHeader className="relative pb-2 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-2xl bg-background/42 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.08)]">
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]" />
              <Brain className="relative h-3.5 w-3.5 text-violet-300" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Begyn
              </span>
              <div className="mt-0.5 text-[10px] text-muted-foreground/60">
                {getPhaseLabel(phase)} · {coachStateLabel}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-full bg-background/30 p-2 text-muted-foreground/50 transition-all hover:-translate-y-0.5 hover:bg-background/45 hover:text-muted-foreground disabled:opacity-30"
            title="Get a new suggestion"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="relative pb-4">
        {loading && !suggestion && (
          <div className="rounded-[1.65rem] bg-background/34 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.07)]">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300 shadow-[0_0_14px_rgba(167,139,250,0.7)]" />
              Reading the current state
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-background/50">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-300" />
            </div>
          </div>
        )}

        {error && !suggestion && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Couldn't load your next suggestion right now.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-8 text-xs">Try again</Button>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/app/goals">Start with goals <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </div>
        )}

        {limitHit && (
          <AIUsageLimitNotice
            feature="AI coach refresh"
            message={limitMessage ?? undefined}
            className="mb-3"
          />
        )}

        {suggestion && !isCompleted && (
          <div className="rounded-[1.65rem] bg-background/34 p-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.07)] transition-all duration-700">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background/40 text-xl shadow-[inset_0_0_0_1px_rgba(148,163,184,0.06)]">
                {loading ? <Sparkles className="h-4 w-4 animate-pulse text-violet-300" /> : (
                  <span aria-hidden="true">
                  {suggestion.emoji}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/80">
                    {signalChip}
                  </span>
                </div>
                <p className="text-[1.28rem] font-semibold leading-[1.12] tracking-tight">
                  {loading ? <span className="text-muted-foreground">Refreshing...</span> : suggestion.action}
                </p>
                {suggestion.reason && !loading && (
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{suggestion.reason}</p>
                )}
                <p className="mt-2 text-xs leading-5 text-muted-foreground/70">{companionInsight}</p>
              </div>
            </div>

            {!loading && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background/30 text-muted-foreground/60 transition-all hover:-translate-y-0.5 hover:bg-emerald-500/10 hover:text-emerald-400"
                  title="Mark complete"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <Button asChild size="sm" className="h-9 flex-1 gap-1.5 rounded-full bg-foreground/92 text-background shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5 hover:bg-foreground">
                  <Link to={suggestion.href}>Open path <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {suggestion && isCompleted && (
          <div className="rounded-[1.65rem] bg-emerald-500/[0.07] p-4 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.10)]">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-lg">
                {suggestion.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">Momentum secured</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {suggestion.action}
                </p>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateNextMove}
                variant="ghost"
                className="h-8 gap-1.5 rounded-full text-xs text-muted-foreground"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Next move
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AICoachCard() {
  return (
    <ErrorBoundary
      variant="card"
      fallback={(error, reset) => (
        <CardErrorFallback error={error} onRetry={reset} label="AI Coach" colSpan="lg:col-span-12" />
      )}
    >
      <AICoachCardInner />
    </ErrorBoundary>
  );
}
