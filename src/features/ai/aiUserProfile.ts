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
  const activeGoals = goals.filter((g) => {
    const total = g.steps.length;
    if (total === 0) return true;
    // Consider "active" if less than 80% complete (no access to done map here,
    // so we use step count as a proxy — goals with steps are being tracked)
    return true;
  });

  const goalLines = activeGoals
    .slice(0, 8) // cap at 8 to keep context concise
    .map((g) => {
      const stepCount = g.steps.length;
      return `- ${g.emoji} "${g.title}" (${g.priority} priority, ${stepCount} steps)`;
    })
    .join("\n");

  // ── Fitness summary ───────────────────────────────────────────────────
  const fitnessSummary = fitnessStore
    ? Object.values(fitnessStore.lifts)
        .filter((l) => l.history.length > 0)
        .map((l) => {
          const best = Math.max(...l.history.map((e) => e.value));
          return `${l.label}: ${best}${l.unit} PR (goal: ${l.goal}${l.unit})`;
        })
        .join(", ") || "No lifts logged yet"
    : "No fitness data";

  // ── Nutrition summary ─────────────────────────────────────────────────
  const profileMacros = nutritionPhase === "cut"
    ? profile?.macro_cut
    : profile?.macro_maintain;

  const nutritionSummary = nutritionLog
    ? `Phase: ${nutritionPhase}, ${Object.values(nutritionLog.eaten ?? {}).filter(Boolean).length} meals logged today`
    : "No nutrition data today";

  // ── Profile summary ───────────────────────────────────────────────────
  const profileSummary = profile
    ? [
        profile.display_name ? `Name: ${profile.display_name}` : null,
        profile.age ? `Age: ${profile.age}` : null,
        profile.sex ? `Sex: ${profile.sex}` : null,
        profile.weight_kg ? `Weight: ${profile.weight_kg}kg` : null,
        profile.height_cm ? `Height: ${profile.height_cm}cm` : null,
        profile.activity_level ? `Activity: ${profile.activity_level}` : null,
        profileMacros ? `Daily targets: ${profileMacros.cal}kcal, ${profileMacros.protein}g protein` : null,
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