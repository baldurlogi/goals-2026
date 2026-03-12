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

const CACHE_KEY          = "cache:ai-coach:v1";
const LAST_MODULE_KEY    = "cache:ai-coach:last-module";
const CACHE_TTL          = 60 * 60 * 1000; // 1 hour
const SUPABASE_FN = "https://jvtpemjrswfwsiwkhreq.supabase.co/functions/v1/hyper-responder";

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
    // Persist the module so next refresh avoids repeating it
    if (suggestion.module) {
      localStorage.setItem(LAST_MODULE_KEY, suggestion.module);
    }
  } catch { /* storage full */ }
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

function readLastModule(): string | null {
  try { return localStorage.getItem(LAST_MODULE_KEY); } catch { return null; }
}

// ── Fetch from edge function ──────────────────────────────────────────────────

async function fetchCoachSuggestion(): Promise<CoachSuggestion> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not signed in");

  const { systemContext } = await buildAIContext();
  const lastSuggestedModule = readLastModule();

  const res = await fetch(SUPABASE_FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
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
      data.message ?? "Monthly AI limit reached. Upgrade for more AI suggestions.",
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch suggestion");
  }

  const data = await res.json();
  const s = data.suggestion as CoachSuggestion;

  // Validate shape
  if (!s?.action || !s?.href) throw new Error("Invalid suggestion shape");
  return s;
}

// ── Card inner ────────────────────────────────────────────────────────────────

// Build a static suggestion from priority logic (no AI, no network)
async function buildStaticSuggestion(): Promise<CoachSuggestion> {
  const signals = await buildAISignals();
  const candidates = buildSuggestionCandidates(signals);
  const top = candidates[0];
  if (!top) throw new Error("No candidates");

  const EMOJI: Record<string, string> = {
    goals: "🎯", reading: "📖", nutrition: "🥗",
    fitness: "💪", todos: "✅", schedule: "📅",
  };

  return {
    action: top.action,
    reason: top.reason,
    href: top.href,
    emoji: EMOJI[top.module] ?? "💡",
    module: top.module,
  };
}

function AICoachCardInner() {
  const [suggestion, setSuggestion] = useState<CoachSuggestion | null>(null);
  const [loading, setLoading]       = useState(true); // true on mount — loads static immediately
  const [error, setError]           = useState<string | null>(null);
  const [isAI, setIsAI]             = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);


  // On mount: always show static priority-based suggestion, ignore stale AI cache
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
      // Fall back to AI cache if static fails
      const cached = readCache();
      if (cached) { setSuggestion(cached); }
      else { setError(e instanceof Error ? e.message : "Something went wrong"); }
    } finally {
      setLoading(false);
    }
  }, []);

  // On refresh button: fetch AI suggestion
  const loadAI = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLimitHit(false);
    setLimitMessage(null);
    try {
      const s = await fetchCoachSuggestion();
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
  }, []);

  // Load static on mount
  useEffect(() => { void loadStatic(); }, [loadStatic]);

  function handleRefresh() {
    clearCache();
    if (isAI) {
      // Already showing AI — get a new static suggestion first, then AI
      void loadStatic();
    } else {
      // Upgrade to AI suggestion
      void loadAI();
    }
  }

  return (
    <Card className="relative overflow-hidden lg:col-span-12">
      {/* Animated gradient top border */}
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
        {/* Loading state */}
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

        {/* Error state */}
        {error && !suggestion && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Couldn't load suggestion right now.</p>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="h-7 shrink-0 text-xs">
              Try again
            </Button>
          </div>
        )}

        {/* Limit hit */}
        {limitHit && (
          <AIUsageLimitNotice
            feature="AI coach refresh"
            message={limitMessage ?? undefined}
            className="mb-4"
          />
        )}

        {/* Suggestion */}
        {suggestion && (
          <div className="flex items-center gap-4">
            {/* Emoji badge */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl">
              {suggestion.emoji}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug">
                {loading ? (
                  <span className="text-muted-foreground">Refreshing…</span>
                ) : (
                  suggestion.action
                )}
              </p>
              {suggestion.reason && !loading && (
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  {suggestion.reason}
                </p>
              )}
            </div>

            {/* CTA */}
            {!loading && (
              <Button asChild size="sm" className="shrink-0 gap-1.5">
                <Link to={suggestion.href}>
                  Go <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Powered by badge */}
        <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/40">
          <Zap className="h-2.5 w-2.5" />
          <span>{isAI ? "AI-powered suggestion" : "Smart suggestion · hit ↻ for AI"} · uses your goals, fitness, reading & nutrition data</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Export with error boundary ────────────────────────────────────────────────

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