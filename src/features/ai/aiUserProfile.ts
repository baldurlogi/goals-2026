import { supabase } from "@/lib/supabaseClient";

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

export async function loadAIProfile(): Promise<AIUserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("ai_user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("loadAIProfile error:", error);
    return null;
  }

  return (data as AIUserProfile | null) ?? null;
}

export async function saveAIProfile(
  patch: Partial<Omit<AIUserProfile, "user_id" | "updated_at">>,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("ai_user_profiles")
    .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });

  if (error) {
    console.warn("saveAIProfile error:", error);
  }
}