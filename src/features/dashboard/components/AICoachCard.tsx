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
import { AIUsageInlineHint } from "@/features/subscription/AIUsageInlineHint";
import type { Tier } from "@/features/subscription/useTier";
import {
  markAIUsageLimitReached,
  writeAIUsageCache,
} from "@/features/subscription/aiUsageCache";
import { READING_CHANGED_EVENT } from "@/features/reading/readingStorage";

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

type CoachUsagePayload = {
  tier?: Tier;
  monthly_limit?: number;
  prompts_used?: number;
  remaining?: number;
};

type CoachResponse = {
  suggestion?: CoachSuggestion;
  usage?: CoachUsagePayload;
};

type CoachLimitPayload = {
  error?: string;
  message?: string;
  tier?: Tier;
  monthly_limit?: number;
  prompts_used?: number;
};

class AIUsageLimitError extends Error {
  tier?: Tier;

  constructor(message: string, tier?: Tier) {
    super(message);
    this.name = "AIUsageLimitError";
    this.tier = tier;
  }
}

const CACHE_KEY = "cache:ai-coach:v1";
const LAST_MODULE_KEY = "cache:ai-coach:last-module";
const LAST_SESSION_KEY = "cache:ai-coach:last-session:v1";
const CACHE_TTL = 60 * 60 * 1000;
const SUPABASE_FN = "https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder";

function readCache(): CoachSuggestion | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.builtAt > CACHE_TTL) return null;
    return entry.suggestion;
  } catch {
    return null;
  }
}

function writeCache(suggestion: CoachSuggestion) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ suggestion, builtAt: Date.now() }));
    if (suggestion.module) {
      localStorage.setItem(LAST_MODULE_KEY, suggestion.module);
    }
  } catch {
    // ignore storage failures
  }
}

function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

function readLastModule(): string | null {
  try {
    return localStorage.getItem(LAST_MODULE_KEY);
  } catch {
    return null;
  }
}

type LastSession = { date: string; goalId: string; goalTitle: string; stepLabel: string };

function readLastSession(): LastSession | null {
  try {
    const raw = localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastSession;
  } catch {
    return null;
  }
}

async function fetchCoachSuggestion(): Promise<CoachSuggestion> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");

  const { systemContext } = await buildAIContext();
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
    const data = (await res.json().catch(() => ({}))) as CoachLimitPayload;

    if (data.error === "rate_limit_exceeded") {
      throw new Error(data.message ?? "Too many requests. Please wait a moment.");
    }

    markAIUsageLimitReached({
      tier: data.tier,
      monthly_limit: data.monthly_limit,
      prompts_used: data.prompts_used,
    });

    throw new AIUsageLimitError(
      data.message ?? "Monthly AI limit reached. Upgrade for more AI suggestions.",
      data.tier,
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch suggestion");
  }

  const data = (await res.json()) as CoachResponse;
  if (data.usage) {
    writeAIUsageCache(data.usage);
  }

  const suggestion = data.suggestion as CoachSuggestion;
  if (!suggestion?.action || !suggestion?.href) {
    throw new Error("Invalid suggestion shape");
  }

  return suggestion;
}

function buildStarterSuggestion(
  signals: Awaited<ReturnType<typeof buildAISignals>>,
): CoachSuggestion | null {
  if (signals.modules.includes("goals") && signals.goals.count === 0) {
    return {
      action: "Create your first goal",
      reason: "Start with one meaningful goal so your coach can guide your next steps.",
      href: "/app/goals",
      emoji: "🎯",
      module: "goals",
    };
  }

  if (signals.modules.includes("reading") && !signals.reading.currentBookTitle) {
    return {
      action: "Add your current book",
      reason: "Once a book is set, your coach can help you keep reading momentum.",
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
      reason: "A quick nutrition check-in gives the coach something real to work with.",
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

  if (signals.modules.includes("schedule") && signals.schedule?.totalBlocks === 0) {
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

async function buildStaticSuggestion(): Promise<CoachSuggestion> {
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  })();

  const session = readLastSession();
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

function AICoachCardInner() {
  const [suggestion, setSuggestion] = useState<CoachSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAI, setIsAI] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [limitTier, setLimitTier] = useState<Tier | null>(null);

  const loadStatic = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsAI(false);
    setLimitHit(false);
    setLimitMessage(null);
    setLimitTier(null);

    try {
      const next = await buildStaticSuggestion();
      setSuggestion(next);
    } catch (e) {
      const cached = readCache();
      if (cached) {
        setSuggestion(cached);
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAI = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLimitHit(false);
    setLimitMessage(null);
    setLimitTier(null);

    try {
      const next = await fetchCoachSuggestion();
      writeCache(next);
      setSuggestion(next);
      setIsAI(true);
    } catch (e) {
      if (e instanceof AIUsageLimitError) {
        setLimitHit(true);
        setLimitMessage(e.message);
        setLimitTier(e.tier ?? null);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatic();

    function handleReadingChanged() {
      clearCache();
      void loadStatic();
    }

    window.addEventListener(READING_CHANGED_EVENT, handleReadingChanged);
    return () => {
      window.removeEventListener(READING_CHANGED_EVENT, handleReadingChanged);
    };
  }, [loadStatic]);

  function handleRefresh() {
    clearCache();
    if (isAI) {
      void loadStatic();
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
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load your next suggestion right now.
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
            tier={limitTier ?? undefined}
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
                {loading ? <span className="text-muted-foreground">Refreshing…</span> : suggestion.action}
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

        <div className="mt-3 space-y-2">
          {!limitHit && (
            <AIUsageInlineHint actionLabel="Refreshing for an AI suggestion uses 1 AI prompt" />
          )}

          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40">
            <Zap className="h-2.5 w-2.5" />
            <span>
              {isAI ? 'AI-powered suggestion' : 'Smart suggestion · hit ↻ for AI'} · uses your goals, fitness, reading & nutrition data
            </span>
          </div>
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
