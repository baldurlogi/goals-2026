import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabaseFunctionUrl, supabase } from "@/lib/supabaseClient";
import { buildAIContext } from "@/features/ai/buildAIContext";
import { buildAISignals } from "@/features/ai/aiSignals";
import { buildSuggestionCandidates } from "@/features/ai/suggestionCandidates";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { AIUsageLimitNotice } from "@/features/subscription/AIUsageLimitNotice";
import { useAIUsage } from "@/features/subscription/useAIUsage";
import { writeAIUsageCache } from "@/features/subscription/aiUsageCache";
import {
  AI_ACTION_CREDIT_COSTS,
  formatCreditCost,
  coerceAIUsage,
} from "@/features/subscription/aiCredits";
import { READING_CHANGED_EVENT } from "@/features/reading/readingStorage";
import { WATER_CHANGED_EVENT } from "@/features/water/waterStorage";
import { SCHEDULE_CHANGED_EVENT } from "@/features/schedule/scheduleStorage";
import { FITNESS_CHANGED_EVENT } from "@/features/fitness/constants";
import { capture } from "@/lib/analytics";
import {
  getScopedStorageItem,
  removeScopedStorageItem,
  writeScopedStorageItem,
} from "@/lib/activeUser";
import { useAuth } from "@/features/auth/authContext";
import { GOAL_MODULE_CHANGED_EVENT } from "@/lib/goalModuleStorage";
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
};

class AIUsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIUsageLimitError";
  }
}

const CACHE_KEY        = "cache:ai-coach:v1";
const LAST_MODULE_KEY  = "cache:ai-coach:last-module";
const LAST_SESSION_KEY = "cache:ai-coach:last-session:v1";
const COMPLETED_SUGGESTION_KEY = "cache:ai-coach:completed:v1";
const CACHE_TTL        = 60 * 60 * 1000;
const SUPABASE_FN      = getSupabaseFunctionUrl("hyper-responder");

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

    return {
      suggestion,
      completedAt: parsed.completedAt,
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

// ── Fetch from edge function ──────────────────────────────────────────────────

function buildAlternativeSuggestion(
  signals: Awaited<ReturnType<typeof buildAISignals>>,
  blockedSignatures: string[],
): CoachSuggestion | null {
  const blocked = new Set(blockedSignatures);

  const starter = buildStarterSuggestion(signals);
  if (starter && !blocked.has(suggestionSignature(starter))) {
    return starter;
  }

  const candidates = buildSuggestionCandidates(signals);
  for (const candidate of candidates) {
    const nextSuggestion = candidateToCoachSuggestion(candidate);
    if (!blocked.has(suggestionSignature(nextSuggestion))) {
      return nextSuggestion;
    }
  }

  return null;
}

async function fetchCoachSuggestion(
  avoidSignature?: string | null,
): Promise<CoachSuggestion> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) throw new Error("Not signed in");

  const { systemContext, signals } = await buildAIContext(true);
  const lastSuggestedModule = readLastModule();

  const res = await fetch(SUPABASE_FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action: "coach",
      userContext: systemContext,
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

  const normalized = normalizeCoachSuggestion(s, signals);
  if (avoidSignature && suggestionSignature(normalized) === avoidSignature) {
    return buildAlternativeSuggestion(signals, [avoidSignature]) ?? normalized;
  }

  return normalized;
}

// ── Starter + static suggestion builders ─────────────────────────────────────

function buildStarterSuggestion(signals: Awaited<ReturnType<typeof buildAISignals>>): CoachSuggestion | null {
  if (signals.modules.includes("goals") && signals.goals.count === 0) {
    return { action: "Create your first goal", reason: "Start with one meaningful goal so your coach can guide your next steps.", href: "/app/goals", emoji: "🎯", module: "goals" };
  }
  if (signals.modules.includes("reading") && !signals.reading.currentBookTitle) {
    return { action: "Add your current book", reason: "Once a book is set, your coach can help you keep reading momentum.", href: "/app/reading", emoji: "📖", module: "reading" };
  }
  if (signals.modules.includes("fitness") && signals.fitness.daysSinceWorkout === null && !signals.fitness.strongestLift && !signals.fitness.weakestLift) {
    return { action: "Add your first PR goal", reason: "Track one lift or skill so the coach can help you push progress.", href: "/app/fitness", emoji: "💪", module: "fitness" };
  }
  if (signals.modules.includes("nutrition") && signals.nutrition.mealsLoggedToday === 0) {
    return { action: "Log your first meal", reason: "A quick nutrition check-in gives the coach something real to work with.", href: "/app/nutrition", emoji: "🥗", module: "nutrition" };
  }
  if (signals.modules.includes("sleep") && !signals.sleep.lastLogDate) {
    return { action: "Log last night's sleep", reason: "A simple sleep entry helps your coach spot recovery patterns.", href: "/app/sleep", emoji: "😴", module: "sleep" };
  }
  if (signals.modules.includes("wellbeing") && !signals.wellbeing.lastLogDate) {
    return { action: "Do a quick check-in", reason: "One wellbeing note gives your coach better context for today.", href: "/app/wellbeing", emoji: "💚", module: "wellbeing" };
  }
  if (signals.modules.includes("schedule") && signals.schedule?.totalBlocks === 0) {
    return { action: "Set up today's schedule", reason: "A simple plan makes your next move much easier to choose.", href: "/app/schedule", emoji: "📅", module: "schedule" };
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
    action: nextMeal.action,
    reason: nextMeal.reason,
    href: "/app/nutrition",
    emoji: meals === 0 ? "🥗" : "🍽️",
    module: "nutrition",
  };
}

function normalizeCoachSuggestion(
  suggestion: CoachSuggestion,
  signals: Awaited<ReturnType<typeof buildAISignals>>,
): CoachSuggestion {
  const candidates = buildSuggestionCandidates(signals);
  const topCandidate = candidates[0] ?? null;
  const topPriority = topCandidate?.priority ?? 0;
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

  return suggestion;
}

function buildCurrentSuggestionActionKeys(
  signals: Awaited<ReturnType<typeof buildAISignals>>,
): Set<string> {
  const keys = new Set<string>();
  const starter = buildStarterSuggestion(signals);
  if (starter) {
    keys.add(suggestionActionKey(starter));
  }

  const candidates = buildSuggestionCandidates(signals);
  for (const candidate of candidates) {
    keys.add(suggestionActionKey(candidateToCoachSuggestion(candidate)));
  }

  return keys;
}

async function shouldAutoCompleteSuggestion(
  suggestion: CoachSuggestion | null,
): Promise<boolean> {
  if (!suggestion) return false;

  const signals = await buildAISignals(true);
  const currentActionKeys = buildCurrentSuggestionActionKeys(signals);

  return !currentActionKeys.has(suggestionActionKey(suggestion));
}

async function buildStaticSuggestion(
  blockedSignatures: string[] = [],
): Promise<CoachSuggestion> {
  const signals = await buildAISignals(true);
  const alternate = buildAlternativeSuggestion(signals, blockedSignatures);
  if (alternate) return alternate;

  const candidates = buildSuggestionCandidates(signals);
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
  );
}

// ── Usage pill ────────────────────────────────────────────────────────────────

function UsagePill() {
  const { used, limit, pct, tier, loading } = useAIUsage();
  if (loading) return null;

  const isNearLimit = pct >= 80;
  const isAtLimit   = pct >= 100;

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={[
              "h-full rounded-full transition-all duration-500",
              isAtLimit ? "bg-destructive" : isNearLimit ? "bg-amber-500" : "bg-violet-500",
            ].join(" ")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/60">
          {used}/{limit} credits
        </span>
      </div>

      {isNearLimit && tier !== "pro_max" && (
        <Link
          to="/app/upgrade"
          className="shrink-0 text-[10px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          Pricing preview →
        </Link>
      )}
    </div>
  );
}

// ── Card inner ────────────────────────────────────────────────────────────────

function AICoachCardInner() {
  const { userId, authReady } = useAuth();
  const [suggestion, setSuggestion] = useState<CoachSuggestion | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isAI, setIsAI]             = useState(false);
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

  const loadStatic = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsAI(false);
    setLimitHit(false);
    setLimitMessage(null);
    try {
      const s = await buildStaticSuggestion();
      setSuggestion(s);
    } catch (e) {
      const cached = readCache();
      if (cached) { setSuggestion(cached); }
      else { setError(e instanceof Error ? e.message : "Something went wrong"); }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAI = useCallback(async (avoidSignature?: string | null) => {
    clearCompletedSuggestion(userId);
    setCompletedSuggestion(null);
    setLoading(true);
    setError(null);
    setLimitHit(false);
    setLimitMessage(null);
    try {
      const s = await fetchCoachSuggestion(avoidSignature);
      writeCache(s);
      setSuggestion(s);
      setIsAI(true);
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
      const isAutoCompleted = await shouldAutoCompleteSuggestion(suggestion);
      if (!isAutoCompleted) return;

      writeCompletedSuggestion(userId, suggestion);
      setCompletedSuggestion({
        suggestion,
        completedAt: Date.now(),
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
      completedSuggestion ?? readCompletedSuggestion(userId);

    if (storedCompletedSuggestion) {
      if (!completedSuggestion) {
        setCompletedSuggestion(storedCompletedSuggestion);
      }
      setSuggestion(storedCompletedSuggestion.suggestion);
      setLoading(false);
      return;
    }

    void loadStatic();
    const handleReadingChanged = () => { clearCache(); void loadStatic(); };
    window.addEventListener(READING_CHANGED_EVENT, handleReadingChanged);
    return () => window.removeEventListener(READING_CHANGED_EVENT, handleReadingChanged);
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
    window.addEventListener(GOAL_MODULE_CHANGED_EVENT, sync);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener(READING_CHANGED_EVENT, sync);
      window.removeEventListener(WATER_CHANGED_EVENT, sync);
      window.removeEventListener(SCHEDULE_CHANGED_EVENT, sync);
      window.removeEventListener(FITNESS_CHANGED_EVENT, sync);
      window.removeEventListener(GOAL_MODULE_CHANGED_EVENT, sync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [authReady, completedSuggestion, syncCompletionFromLiveState]);

  function handleRefresh() {
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
    });
  }

  function handleGenerateNextMove() {
    clearCache();
    clearCompletedSuggestion(userId);
    setCompletedSuggestion(null);
    void loadAI();
  }

  return (
    <Card className="relative overflow-hidden lg:col-span-12">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-400 via-pink-400 to-orange-400" />

      <CardHeader className="pb-3 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Your next move
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground disabled:opacity-30"
            title="Get a new suggestion"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        {loading && !suggestion && (
          <div className="flex items-center gap-3 py-1">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-pink-400 [animation-delay:300ms]" />
            </div>
            <span className="text-sm text-muted-foreground">Thinking about your day…</span>
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
            className="mb-4"
          />
        )}

        {suggestion && !isCompleted && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl">
                {suggestion.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-snug">
                  {loading ? <span className="text-muted-foreground">Refreshing…</span> : suggestion.action}
                </p>
                {suggestion.reason && !loading && (
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{suggestion.reason}</p>
                )}
              </div>
              {!loading && (
                <Button asChild size="sm" className="shrink-0 gap-1.5">
                  <Link to={suggestion.href}>Go <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              )}
            </div>

            {!loading && (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkCompleted}
                >
                  Completed it
                </Button>
              </div>
            )}
          </div>
        )}

        {suggestion && isCompleted && (
          <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                {suggestion.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Done!
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  You completed <span className="font-medium text-foreground">{suggestion.action}</span>.
                  Generate another suggestion only when you want to spend the next {formatCreditCost(AI_ACTION_CREDIT_COSTS.coachSuggestion)}.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateNextMove}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate next move
              </Button>
            </div>
          </div>
        )}

        {/* Usage pill — always visible */}
        <div className="mt-2 border-t border-border/40 pt-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 mb-1.5">
            <Zap className="h-2.5 w-2.5" />
            <span>
              {isCompleted
                ? `Next move completed · generating another uses ${formatCreditCost(AI_ACTION_CREDIT_COSTS.coachSuggestion)}`
                : isAI
                  ? `AI-powered suggestion · refresh uses ${formatCreditCost(AI_ACTION_CREDIT_COSTS.coachSuggestion)}`
                  : "Smart suggestion · hit ↻ for AI"}
              {" "}· uses your goals, fitness, reading & nutrition data
            </span>
          </div>
          <UsagePill />
        </div>
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
