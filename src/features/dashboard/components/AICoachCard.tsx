import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Sparkles, RefreshCw, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { buildAIContext } from "@/features/ai/buildAIContext";
import { buildAISignals } from "@/features/ai/aiSignals";
import { buildSuggestionCandidates } from "@/features/ai/suggestionCandidates";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { AIUsageLimitNotice } from "@/features/subscription/AIUsageLimitNotice";
import { READING_CHANGED_EVENT } from "@/features/reading/readingStorage";
import { useAuth } from "@/features/auth/authContext";

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

class AIUsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIUsageLimitError";
  }
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const SUPABASE_FN =
  "https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder";

function scheduleIdle(callback: () => void, delay = 0) {
  let timeoutId: number | null = null;
  let idleId: number | null = null;

  const run = () => {
    const w = window as Window & {
      requestIdleCallback?: (
        cb: () => void,
        options?: { timeout: number }
      ) => number;
    };

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(callback, { timeout: 1200 });
      return;
    }

    timeoutId = window.setTimeout(callback, 1);
  };

  timeoutId = window.setTimeout(run, delay);

  return () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    const w = window as Window & {
      cancelIdleCallback?: (id: number) => void;
    };

    if (idleId !== null && typeof w.cancelIdleCallback === "function") {
      w.cancelIdleCallback(idleId);
    }
  };
}

// ── User-scoped cache helpers ────────────────────────────────────────────────

function coachCacheKey(userId: string) {
  return `cache:ai-coach:v2:${userId}`;
}

function lastModuleKey(userId: string) {
  return `cache:ai-coach:last-module:v2:${userId}`;
}

function lastSessionKey(userId: string) {
  return `cache:ai-coach:last-session:v2:${userId}`;
}

function readCache(userId: string | null): CoachSuggestion | null {
  if (!userId) return null;

  try {
    const raw = localStorage.getItem(coachCacheKey(userId));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.builtAt > CACHE_TTL) return null;
    return entry.suggestion;
  } catch {
    return null;
  }
}

function writeCache(userId: string | null, suggestion: CoachSuggestion) {
  if (!userId) return;

  try {
    localStorage.setItem(
      coachCacheKey(userId),
      JSON.stringify({ suggestion, builtAt: Date.now() })
    );

    if (suggestion.module) {
      localStorage.setItem(lastModuleKey(userId), suggestion.module);
    }
  } catch {
    // ignore
  }
}

function clearCache(userId: string | null) {
  if (!userId) return;

  try {
    localStorage.removeItem(coachCacheKey(userId));
  } catch {
    // ignore
  }
}

function readLastModule(userId: string | null): string | null {
  if (!userId) return null;

  try {
    return localStorage.getItem(lastModuleKey(userId));
  } catch {
    return null;
  }
}

type LastSession = {
  date: string;
  goalId: string;
  goalTitle: string;
  stepLabel: string;
};

function readLastSession(userId: string | null): LastSession | null {
  if (!userId) return null;

  try {
    const raw = localStorage.getItem(lastSessionKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as LastSession;
  } catch {
    return null;
  }
}

// ── Fetch from edge function ──────────────────────────────────────────────────

async function fetchCoachSuggestion(userId: string): Promise<CoachSuggestion> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) throw new Error("Not signed in");

  const { systemContext } = await buildAIContext();
  const lastSuggestedModule = readLastModule(userId);

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
      data.message ?? "Monthly AI limit reached. Upgrade for more AI suggestions."
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch suggestion");
  }

  const data = await res.json();
  const s = data.suggestion as CoachSuggestion;

  if (!s?.action || !s?.href) throw new Error("Invalid suggestion shape");
  return s;
}

// ── Static suggestion ─────────────────────────────────────────────────────────

function buildStarterSuggestion(
  signals: Awaited<ReturnType<typeof buildAISignals>>
): CoachSuggestion | null {
  if (signals.modules.includes("goals") && signals.goals.count === 0) {
    return {
      action: "Create your first goal",
      reason:
        "Start with one meaningful goal so your coach can guide your next steps.",
      href: "/app/goals",
      emoji: "🎯",
      module: "goals",
    };
  }

  if (signals.modules.includes("reading") && !signals.reading.currentBookTitle) {
    return {
      action: "Add your current book",
      reason:
        "Once a book is set, your coach can help you keep reading momentum.",
      href: "/app/reading",
      emoji: "📖",
      module: "reading",
    };
  }

  if (
    signals.modules.includes("fitness") &&
    signals.fitness.daysSinceWorkout === null &&
    !signals.fitness.strongestLift &&
    !signals.fitness.weakestLift
  ) {
    return {
      action: "Add your first PR goal",
      reason: "Track one lift or skill so the coach can help you push progress.",
      href: "/app/fitness",
      emoji: "💪",
      module: "fitness",
    };
  }

  if (
    signals.modules.includes("nutrition") &&
    signals.nutrition.mealsLoggedToday === 0
  ) {
    return {
      action: "Log your first meal",
      reason:
        "A quick nutrition check-in gives the coach something real to work with.",
      href: "/app/nutrition",
      emoji: "🥗",
      module: "nutrition",
    };
  }

  if (signals.modules.includes("todos") && signals.todos?.totalToday === 0) {
    return {
      action: "Add one small to-do",
      reason: "Even one task gives your coach a concrete place to start.",
      href: "/app/todos",
      emoji: "✅",
      module: "todos",
    };
  }

  if (
    signals.modules.includes("schedule") &&
    signals.schedule?.totalBlocks === 0
  ) {
    return {
      action: "Set up today’s schedule",
      reason: "A simple plan makes your next move much easier to choose.",
      href: "/app/schedule",
      emoji: "📅",
      module: "schedule",
    };
  }

  return null;
}

async function buildStaticSuggestion(userId: string): Promise<CoachSuggestion> {
  const signals = await buildAISignals();

  const starter = buildStarterSuggestion(signals);
  if (starter) return starter;

  const candidates = buildSuggestionCandidates(signals);
  const top = candidates[0];

  if (!top) {
    return {
      action: "Review your goals",
      reason: "Start with one goal so your coach can suggest the best next move.",
      href: "/app/goals",
      emoji: "🎯",
      module: "goals",
    };
  }

  const EMOJI: Record<string, string> = {
    goals: "🎯",
    reading: "📖",
    nutrition: "🥗",
    fitness: "💪",
    todos: "✅",
    schedule: "📅",
  };

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const session = readLastSession(userId);
  const hasYesterdaySession = session?.date === yesterday;

  const reason =
    hasYesterdaySession && top.module === "goals" && session.goalId
      ? `You were working on "${session.goalTitle}" yesterday — keep the momentum going.`
      : top.reason;

  return {
    action: top.action,
    reason,
    href: top.href,
    emoji: EMOJI[top.module] ?? "💡",
    module: top.module,
  };
}

// ── Card ──────────────────────────────────────────────────────────────────────

function AICoachCardInner() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [suggestion, setSuggestion] = useState<CoachSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAI, setIsAI] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const loadStatic = useCallback(
    async (targetUserId: string, showSpinner = false) => {
      if (showSpinner) {
        setLoading(true);
      }

      setError(null);
      setIsAI(false);
      setLimitHit(false);
      setLimitMessage(null);

      try {
        const s = await buildStaticSuggestion(targetUserId);
        writeCache(targetUserId, s);
        setSuggestion(s);
      } catch (e) {
        const cached = readCache(targetUserId);
        if (cached) {
          setSuggestion(cached);
        } else {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadAI = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    setLimitHit(false);
    setLimitMessage(null);

    try {
      const s = await fetchCoachSuggestion(userId);
      writeCache(userId, s);
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

  useEffect(() => {
    if (!userId) {
      setSuggestion(null);
      setLoading(false);
      setError(null);
      setIsAI(false);
      setLimitHit(false);
      setLimitMessage(null);
      return;
    }

    const cached = readCache(userId);
    setSuggestion(cached);
    setLoading(cached === null);
    setError(null);
    setIsAI(false);
    setLimitHit(false);
    setLimitMessage(null);

    let cancelled = false;

    const cancelIdleLoad = scheduleIdle(() => {
      if (cancelled) return;
      void loadStatic(userId, cached === null);
    }, cached ? 180 : 40);

    const handleReadingChanged = () => {
      clearCache(userId);
      void loadStatic(userId, false);
    };

    window.addEventListener(READING_CHANGED_EVENT, handleReadingChanged);

    return () => {
      cancelled = true;
      cancelIdleLoad();
      window.removeEventListener(READING_CHANGED_EVENT, handleReadingChanged);
    };
  }, [userId, loadStatic]);

  function handleRefresh() {
    if (!userId) return;

    clearCache(userId);

    if (isAI) {
      void loadStatic(userId, false);
    } else {
      void loadAI();
    }
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
            disabled={loading || !userId}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground disabled:opacity-30"
            title="Get a new suggestion"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pb-5">
        {loading && !suggestion && (
          <div className="flex items-center gap-3 py-1">
            <div className="h-2 w-2 rounded-full bg-violet-400" />
            <span className="text-sm text-muted-foreground">
              Preparing your next move…
            </span>
          </div>
        )}

        {error && !suggestion && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Couldn't load your next suggestion right now.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-8 text-xs"
              >
                Try again
              </Button>

              <Button asChild size="sm" className="gap-1.5">
                <Link to="/app/goals">
                  Start with goals <ArrowRight className="h-3.5 w-3.5" />
                </Link>
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

        {suggestion && (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl">
              {suggestion.emoji}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug">
                {loading ? (
                  <span className="text-muted-foreground">Refreshing…</span>
                ) : (
                  suggestion.action
                )}
              </p>
              {suggestion.reason && !loading && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {suggestion.reason}
                </p>
              )}
            </div>

            {!loading && (
              <Button asChild size="sm" className="shrink-0 gap-1.5">
                <Link to={suggestion.href}>
                  Go <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/40">
          <Zap className="h-2.5 w-2.5" />
          <span>
            {isAI ? "AI-powered suggestion" : "Smart suggestion · hit ↻ for AI"} ·
            uses your goals, fitness, reading & nutrition data
          </span>
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
        <CardErrorFallback
          error={error}
          onRetry={reset}
          label="AI Coach"
          colSpan="lg:col-span-12"
        />
      )}
    >
      <AICoachCardInner />
    </ErrorBoundary>
  );
}