/**
 * aiUserProfile.ts
 *
 * Two responsibilities:
 *  1. CRUD for the ai_user_profiles table
 *  2. buildAIContext() — assembles a rich prompt-ready string from all
 *     user data sources (profile, goals, fitness, nutrition, reading)
 *     and saves a snapshot back to the table for debugging / future use.
 */

import { supabase } from "@/lib/supabaseClient";
import { loadProfile } from "@/features/onboarding/profileStorage";
import { loadUserGoals } from "@/features/goals/userGoalStorage";
import { loadFitness } from "@/features/fitness/fitnessStorage";
import { loadNutritionLog, loadPhase } from "@/features/nutrition/nutritionStorage";

// ── Types ──────────────────────────────────────────────────────────────────

export type PreferredTone = "direct" | "encouraging" | "analytical";

export type AIUserProfile = {
  user_id: string;
  goals_summary: string | null;
  lifestyle_notes: string | null;
  personality_notes: string | null;
  active_modules: string[] | null;
  strongest_streak: string | null;
  weakest_area: string | null;
  avg_goals_per_week: number | null;
  preferred_tone: PreferredTone;
  preferred_step_count: number;
  last_context_snapshot: Record<string, unknown> | null;
  last_context_built_at: string | null;
  updated_at: string | null;
};

/** The assembled context passed into every AI call */
export type AIContext = {
  /** Full prompt-ready string — inject directly into system prompt */
  systemContext: string;
  /** Structured snapshot for debugging / storage */
  snapshot: Record<string, unknown>;
};

// ── Load / save ai_user_profiles ─────────────────────────────────────────

export async function loadAIProfile(): Promise<AIUserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("ai_user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) { console.warn("loadAIProfile error:", error); return null; }
  return data as AIUserProfile | null;
}

export async function saveAIProfile(
  patch: Partial<Omit<AIUserProfile, "user_id" | "updated_at">>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("ai_user_profiles")
    .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });

  if (error) console.warn("saveAIProfile error:", error);
}

// ── Context builder ───────────────────────────────────────────────────────

/**
 * Assembles everything we know about the user into a single rich context
 * object. Call this before any AI request that benefits from personalisation.
 *
 * Fast path: if a snapshot exists and is <30 min old, return cached version.
 * Otherwise rebuild from all data sources and persist the snapshot.
 */
export async function buildAIContext(forceRefresh = false): Promise<AIContext> {
  const aiProfile = await loadAIProfile();

  // Use cached snapshot if fresh enough (30 min)
  if (!forceRefresh && aiProfile?.last_context_snapshot && aiProfile.last_context_built_at) {
    const age = Date.now() - new Date(aiProfile.last_context_built_at).getTime();
    if (age < 30 * 60 * 1000) {
      return {
        systemContext: buildSystemPrompt(aiProfile.last_context_snapshot, aiProfile),
        snapshot: aiProfile.last_context_snapshot,
      };
    }
  }

  // ── Gather all data sources in parallel ──────────────────────────────
  const [profile, goals, fitnessStore, nutritionLog, nutritionPhase] = await Promise.all([
    loadProfile(),
    loadUserGoals(),
    loadFitness().catch(() => null),
    loadNutritionLog().catch(() => null),
    loadPhase().catch(() => "maintain" as const),
  ]);

  // ── Goals summary ─────────────────────────────────────────────────────
  const activeGoals = goals;

  const goalLines = activeGoals
    .slice(0, 8)
    .map((g) => {
      const stepCount = g.steps.length;
      const nextStep = g.steps[0];
      return `- ${g.emoji} "${g.title}" (${g.priority} priority, ${stepCount} steps${nextStep ? `, next action: "${nextStep.label}"` : ", no steps yet"})`;
    })
    .join("\n");

  // ── Fitness summary ───────────────────────────────────────────────────
  const allLiftEntries = fitnessStore
    ? Object.values(fitnessStore.lifts).flatMap((l) => l.history.map((e) => e.date))
    : [];
  const lastWorkoutDate = allLiftEntries.sort().at(-1) ?? null;
  const daysSinceWorkout = lastWorkoutDate
    ? Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / 86400000)
    : null;

  const liftLines = fitnessStore
    ? Object.values(fitnessStore.lifts)
        .map((l) => {
          const best = l.history.length > 0 ? Math.max(...l.history.map((e) => e.value)) : null;
          const pct = best ? Math.round((best / l.goal) * 100) : 0;
          return best
            ? `${l.label}: PR ${best}${l.unit} (${pct}% of ${l.goal}${l.unit} goal)`
            : `${l.label}: no PR yet (goal: ${l.goal}${l.unit})`;
        })
        .join(", ")
    : null;

  const fitnessSummary = liftLines
    ? `${liftLines}. Last workout: ${daysSinceWorkout !== null ? `${daysSinceWorkout} day(s) ago` : "never logged"}`
    : "No fitness data logged yet";

  // ── Nutrition summary ─────────────────────────────────────────────────
  const profileMacros = nutritionPhase === "cut"
    ? profile?.macro_cut
    : profile?.macro_maintain;

  const mealsLogged = nutritionLog
    ? Object.values(nutritionLog.eaten ?? {}).filter(Boolean).length
    : 0;
  const nutritionSummary = nutritionLog
    ? `Phase: ${nutritionPhase}, ${mealsLogged}/7 meals logged today${profileMacros ? `. Calorie target: ${profileMacros.cal}kcal, protein target: ${profileMacros.protein}g` : ""}`
    : "No nutrition data today";

  // ── Reading summary ───────────────────────────────────────────────────
  // Pull from localStorage — always current, avoids extra async roundtrip
  let readingSummary = "No reading data";
  try {
    const readingRaw = localStorage.getItem("daily-life:reading:v2");
    if (readingRaw) {
      const rd = JSON.parse(readingRaw);
      const book = rd?.current ?? rd?.book;
      const streak = rd?.streak?.streak ?? 0;
      const todayMin = rd?.minutes?.minutes ?? 0;
      const targetMin = rd?.minutes?.target ?? 30;
      if (book?.title && book.title !== "Current book") {
        const pagesLeft = (book.totalPages || 0) - (book.currentPage || 0);
        const pct = book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
        readingSummary = `Reading "${book.title}"${book.author ? ` by ${book.author}` : ""} — ${pct}% done (${book.currentPage}/${book.totalPages} pages, ${pagesLeft} left). Streak: ${streak} day(s). Today: ${todayMin}/${targetMin} min.`;
      } else {
        readingSummary = `No book set. Reading streak: ${streak} day(s). Today: ${todayMin}/${targetMin} min.`;
      }
    }
  } catch { /* ignore — not critical */ }

  // ── Profile summary ───────────────────────────────────────────────────
  const profileSummary = profile
    ? [
        profile.display_name ? `Name: ${profile.display_name}` : null,
        profile.age ? `Age: ${profile.age}` : null,
        profile.sex ? `Sex: ${profile.sex}` : null,
        profile.weight_kg ? `Weight: ${profile.weight_kg}kg` : null,
        profile.height_cm ? `Height: ${profile.height_cm}cm` : null,
        profile.activity_level ? `Activity level: ${profile.activity_level}` : null,
      ].filter(Boolean).join(", ")
    : "No profile data";

  // ── Enabled modules ───────────────────────────────────────────────────
  const enabledModules = (profile as unknown as { enabled_modules?: string[] })
    ?.enabled_modules ?? ["goals", "fitness", "nutrition", "reading"];

  // ── AI profile notes ──────────────────────────────────────────────────
  const personalityNotes = aiProfile?.personality_notes
    ?? "User may have ADHD — prefer concrete, actionable suggestions. Break things into small steps.";

  const preferredTone = aiProfile?.preferred_tone ?? "direct";

  // ── Assemble snapshot ─────────────────────────────────────────────────
  const snapshot: Record<string, unknown> = {
    profile: profileSummary,
    activeGoals: goalLines || "No goals set yet",
    goalCount: activeGoals.length,
    fitness: fitnessSummary,
    nutrition: nutritionSummary,
    reading: readingSummary,
    enabledModules,
    personalityNotes,
    preferredTone,
    goalsManualSummary: aiProfile?.goals_summary ?? null,
    lifestyleNotes: aiProfile?.lifestyle_notes ?? null,
    builtAt: new Date().toISOString(),
  };

  // ── Persist snapshot ──────────────────────────────────────────────────
  await saveAIProfile({
    last_context_snapshot: snapshot,
    last_context_built_at: new Date().toISOString(),
    active_modules: enabledModules,
    preferred_step_count: aiProfile?.preferred_step_count ?? 5,
    preferred_tone: preferredTone,
  });

  return {
    systemContext: buildSystemPrompt(snapshot, aiProfile),
    snapshot,
  };
}

// ── System prompt assembler ───────────────────────────────────────────────

function buildSystemPrompt(
  snapshot: Record<string, unknown>,
  aiProfile: AIUserProfile | null,
): string {
  const tone = aiProfile?.preferred_tone ?? "direct";
  const toneInstructions: Record<PreferredTone, string> = {
    direct:       "Be direct and concise. Skip preamble. Lead with the action.",
    encouraging:  "Be warm and encouraging. Celebrate progress. Frame challenges positively.",
    analytical:   "Be precise and data-driven. Reference specific numbers and trends.",
  };

  return `You are a personal life coach AI embedded in the user's daily life dashboard.

## User Profile
${snapshot.profile}

## Active Goals
${snapshot.activeGoals}

## Fitness
${snapshot.fitness}

## Nutrition Today
${snapshot.nutrition}

## Reading
${snapshot.reading}

## Modules the user tracks
${(snapshot.enabledModules as string[]).join(", ")}

${snapshot.goalsManualSummary ? `## User's own goals summary\n${snapshot.goalsManualSummary}\n` : ""}
${snapshot.lifestyleNotes ? `## Lifestyle notes\n${snapshot.lifestyleNotes}\n` : ""}

## Coaching style
${snapshot.personalityNotes}
${toneInstructions[tone as PreferredTone]}

Keep responses focused and actionable. Never repeat back information the user already knows.
When suggesting actions, tie them to their specific goals above.`;
}

// ── Convenience: get context string only ─────────────────────────────────

/**
 * Quick helper for AI calls that just need the system prompt string.
 * Uses cache if available.
 */
export async function getAISystemContext(): Promise<string> {
  const { systemContext } = await buildAIContext();
  return systemContext;
}