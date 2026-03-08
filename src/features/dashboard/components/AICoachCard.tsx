import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RefreshCw, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { buildAISignals } from "@/features/ai/aiSignals";
import {
  buildSuggestionCandidates,
  type SuggestionCandidate,
} from "@/features/ai/suggestionCandidates";
import { ErrorBoundary, CardErrorFallback } from "@/components/ErrorBoundary";
import { NUTRITION_CHANGED_EVENT } from "@/features/nutrition/nutritionStorage";
import { PROFILE_CHANGED_EVENT } from "@/features/onboarding/profileStorage";

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

const CACHE_KEY = "cache:ai-coach:v2";
const LAST_MODULE_KEY = "cache:ai-coach:last-module:v2";
const CACHE_TTL_MS = 20 * 60 * 1000;
const SUPABASE_FN =
  "https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder";

function readCache(): CoachSuggestion | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const entry = JSON.parse(raw) as CacheEntry;
    const age = Date.now() - entry.builtAt;
    return age <= CACHE_TTL_MS ? entry.suggestion : null;
  } catch {
    return null;
  }
}

function writeCache(suggestion: CoachSuggestion) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ suggestion, builtAt: Date.now() }),
    );

    if (suggestion.module) {
      localStorage.setItem(LAST_MODULE_KEY, suggestion.module);
    }
  } catch {
    // ignore
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

function candidateToSuggestion(
  candidate: SuggestionCandidate,
  quotaMessage?: string,
): CoachSuggestion {
  return {
    action: candidate.action,
    reason: quotaMessage ?? candidate.reason,
    href: candidate.href,
    emoji: candidate.emoji,
    module: candidate.module,
  };
}

async function fetchCoachSuggestion(
  forceFreshSignals = false,
): Promise<CoachSuggestion> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not signed in");
  }

  const signals = await buildAISignals(forceFreshSignals);
  const candidates = buildSuggestionCandidates(signals);
  const deterministicFallback = candidates[0]
    ? candidateToSuggestion(candidates[0])
    : {
        action: "Review your upcoming tasks",
        reason: "A quick scan helps you choose your next step.",
        href: "/app/upcoming",
        emoji: "💡",
        module: "goals",
      };

  const res = await fetch(SUPABASE_FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      action: "coach",
      signals,
      candidates,
      lastSuggestedModule: readLastModule(),
    }),
  });

  if (res.status === 429) {
    return candidateToSuggestion(
      candidates[0] ?? {
        module: "goals",
        priority: 0,
        action: "Review your upcoming tasks",
        reason: "A quick scan helps you choose your next step.",
        href: "/app/upcoming",
        emoji: "💡",
      },
      "You've hit your monthly AI limit — here’s the best next move from your current data.",
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch suggestion");
  }

  const data = (await res.json()) as {
    suggestion?: CoachSuggestion;
  };

  if (!data.suggestion?.action || !data.suggestion?.href) {
    return deterministicFallback;
  }

  return data.suggestion;
}

function AICoachCardInner() {
  const [suggestion, setSuggestion] = useState<CoachSuggestion | null>(() =>
    readCache(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!force) {
      const cached = readCache();
      if (cached) {
        setSuggestion(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const next = await fetchCoachSuggestion(force);
      writeCache(next);
      setSuggestion(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleDataChanged = () => {
      clearCache();
      void load(true);
    };

    window.addEventListener(NUTRITION_CHANGED_EVENT, handleDataChanged);
    window.addEventListener(PROFILE_CHANGED_EVENT, handleDataChanged);

    return () => {
      window.removeEventListener(NUTRITION_CHANGED_EVENT, handleDataChanged);
      window.removeEventListener(PROFILE_CHANGED_EVENT, handleDataChanged);
    };
  }, [load]);

  useEffect(() => {
    void load(false);
  }, [load]);

  function handleRefresh() {
    clearCache();
    void load(true);
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
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
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
            <span className="text-sm text-muted-foreground">
              Thinking about your day…
            </span>
          </div>
        )}

        {error && !suggestion && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Couldn't load suggestion right now.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-7 shrink-0 text-xs"
            >
              Try again
            </Button>
          </div>
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

              {suggestion.module && !loading && (
                <div className="mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {suggestion.module}
                </div>
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
            AI-powered · guided by your goals, nutrition, reading and fitness signals
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