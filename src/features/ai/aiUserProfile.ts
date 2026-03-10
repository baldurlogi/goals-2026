import { supabase } from '@/lib/supabaseClient';
import { loadProfile } from '@/features/onboarding/profileStorage';
import { loadUserGoals } from '@/features/goals/userGoalStorage';
import { loadPRGoals, type PRGoal } from '@/features/fitness/fitnessStorage';
import {
  loadNutritionLog,
  loadPhase,
} from '@/features/nutrition/nutritionStorage';
import { getLocalDateKey } from '@/hooks/useTodayDate';

export type PreferredTone =
  | 'direct'
  | 'encouraging'
  | 'analytical'
  | 'tough_love';

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

export type AIContext = {
  systemContext: string;
  snapshot: Record<string, unknown>;
};

function getLatestWorkoutDate(prGoals: PRGoal[]): string | null {
  const allDates = prGoals.flatMap((goal) =>
    Array.isArray(goal.history)
      ? goal.history
          .map((entry) => (typeof entry.date === 'string' ? entry.date : null))
          .filter((date): date is string => Boolean(date))
      : [],
  );

  return [...allDates].sort().at(-1) ?? null;
}

function daysSince(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / 86400000);
}

function buildFitnessSummary(prGoals: PRGoal[]): string {
  if (!Array.isArray(prGoals) || prGoals.length === 0) {
    return 'No fitness data logged yet';
  }

  const liftLines = prGoals
    .map((goal) => {
      const history = Array.isArray(goal.history) ? goal.history : [];
      const best =
        history.length > 0 ? Math.max(...history.map((entry) => entry.value)) : null;
      const pct =
        best !== null && goal.goal > 0
          ? Math.round((best / goal.goal) * 100)
          : 0;

      return best !== null
        ? `${goal.label}: PR ${best}${goal.unit} (${pct}% of ${goal.goal}${goal.unit} goal)`
        : `${goal.label}: no PR yet (goal: ${goal.goal}${goal.unit})`;
    })
    .join(', ');

  const lastWorkoutDate = getLatestWorkoutDate(prGoals);
  const daysSinceWorkout = daysSince(lastWorkoutDate);

  return `${liftLines}. Last workout: ${
    daysSinceWorkout !== null ? `${daysSinceWorkout} day(s) ago` : 'never logged'
  }`;
}

export async function loadAIProfile(): Promise<AIUserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('ai_user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('loadAIProfile error:', error);
    return null;
  }

  return data as AIUserProfile | null;
}

export async function saveAIProfile(
  patch: Partial<Omit<AIUserProfile, 'user_id' | 'updated_at'>>,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('ai_user_profiles')
    .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' });

  if (error) console.warn('saveAIProfile error:', error);
}

export async function buildAIContext(forceRefresh = false): Promise<AIContext> {
  const aiProfile = await loadAIProfile();

  if (
    !forceRefresh &&
    aiProfile?.last_context_snapshot &&
    aiProfile.last_context_built_at
  ) {
    const age =
      Date.now() - new Date(aiProfile.last_context_built_at).getTime();

    if (age < 30 * 60 * 1000) {
      return {
        systemContext: buildSystemPrompt(
          aiProfile.last_context_snapshot,
          aiProfile,
        ),
        snapshot: aiProfile.last_context_snapshot,
      };
    }
  }

  const [profile, goals, prGoals, nutritionLog, nutritionPhase] =
    await Promise.all([
      Promise.resolve(loadProfile()).catch(() => null),
      Promise.resolve(loadUserGoals()).catch(() => []),
      Promise.resolve(loadPRGoals()).catch(() => []),
      Promise.resolve(loadNutritionLog()).catch(() => null),
      Promise.resolve(loadPhase()).catch(() => 'maintain' as const),
    ]);

  const activeGoals = goals;

  const goalLines = activeGoals
    .slice(0, 8)
    .map((g) => {
      const stepCount = g.steps.length;
      const nextStep = g.steps[0];
      return `- ${g.emoji} "${g.title}" (${g.priority} priority, ${stepCount} steps${
        nextStep ? `, next action: "${nextStep.label}"` : ', no steps yet'
      })`;
    })
    .join('\n');

  const fitnessSummary = buildFitnessSummary(prGoals);

  const profileMacros =
    nutritionPhase === 'cut' ? profile?.macro_cut : profile?.macro_maintain;

  const mealsLogged = nutritionLog
    ? Object.values(nutritionLog.eaten ?? {}).filter(Boolean).length
    : 0;

  const nutritionSummary = nutritionLog
    ? `Phase: ${nutritionPhase}, ${mealsLogged}/7 meals logged today${
        profileMacros
          ? `. Calorie target: ${profileMacros.cal}kcal, protein target: ${profileMacros.protein}g`
          : ''
      }`
    : 'No nutrition data today';

  let readingSummary = 'No reading data';
  try {
    const readingRaw = localStorage.getItem('daily-life:reading:v2');
    if (readingRaw) {
      const rd = JSON.parse(readingRaw);
      const book = rd?.current ?? rd?.book;
      const streak = rd?.streak?.streak ?? 0;
      const todayMin = rd?.minutes?.minutes ?? 0;
      const targetMin = rd?.minutes?.target ?? 30;

      if (book?.title && book.title !== 'Current book') {
        const pagesLeft = (book.totalPages || 0) - (book.currentPage || 0);
        const pct = book.totalPages
          ? Math.round((book.currentPage / book.totalPages) * 100)
          : 0;

        readingSummary = `Reading "${book.title}"${
          book.author ? ` by ${book.author}` : ''
        } — ${pct}% done (${book.currentPage}/${book.totalPages} pages, ${pagesLeft} left). Streak: ${streak} day(s). Today: ${todayMin}/${targetMin} min.`;
      } else {
        readingSummary = `No book set. Reading streak: ${streak} day(s). Today: ${todayMin}/${targetMin} min.`;
      }
    }
  } catch {
    // ignore
  }

  const profileSummary = profile
    ? [
        profile.display_name ? `Name: ${profile.display_name}` : null,
        profile.age ? `Age: ${profile.age}` : null,
        profile.sex ? `Sex: ${profile.sex}` : null,
        profile.weight_kg ? `Weight: ${profile.weight_kg}kg` : null,
        profile.height_cm ? `Height: ${profile.height_cm}cm` : null,
        profile.activity_level ? `Activity level: ${profile.activity_level}` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : 'No profile data';

  const enabledModules = (profile as unknown as { enabled_modules?: string[] })
    ?.enabled_modules ?? ['goals', 'fitness', 'nutrition', 'reading'];

  const personalityNotes =
    aiProfile?.personality_notes ??
    'User may have ADHD — prefer concrete, actionable suggestions. Break things into small steps.';

  const preferredTone = aiProfile?.preferred_tone ?? 'direct';

  const snapshot: Record<string, unknown> = {
    profile: profileSummary,
    activeGoals: goalLines || 'No goals set yet',
    goalCount: activeGoals.length,
    fitness: fitnessSummary,
    nutrition: nutritionSummary,
    reading: readingSummary,
    enabledModules,
    personalityNotes,
    preferredTone,
    goalsManualSummary: aiProfile?.goals_summary ?? null,
    lifestyleNotes: aiProfile?.lifestyle_notes ?? null,
    builtAt: getLocalDateKey(),
  };

  await saveAIProfile({
    last_context_snapshot: snapshot,
    last_context_built_at: getLocalDateKey(),
    active_modules: enabledModules,
    preferred_step_count: aiProfile?.preferred_step_count ?? 5,
    preferred_tone: preferredTone,
  });

  return {
    systemContext: buildSystemPrompt(snapshot, aiProfile),
    snapshot,
  };
}

function buildSystemPrompt(
  snapshot: Record<string, unknown>,
  aiProfile: AIUserProfile | null,
): string {
  const tone = aiProfile?.preferred_tone ?? 'direct';

  const toneInstructions: Record<PreferredTone, string> = {
    direct: 'Be direct and concise. Skip preamble. Lead with the action.',
    encouraging:
      'Be warm and encouraging. Celebrate progress. Frame challenges positively.',
    analytical:
      'Be precise and data-driven. Reference specific numbers and trends.',
    tough_love:
      "Be honest and no-nonsense. Don't sugarcoat gaps. High expectations, zero excuses.",
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
${(snapshot.enabledModules as string[]).join(', ')}

${snapshot.goalsManualSummary ? `## User's own goals summary\n${snapshot.goalsManualSummary}\n` : ''}
${snapshot.lifestyleNotes ? `## Lifestyle notes\n${snapshot.lifestyleNotes}\n` : ''}

## Coaching style
${snapshot.personalityNotes}
${toneInstructions[tone as PreferredTone]}

Keep responses focused and actionable. Never repeat back information the user already knows.
When suggesting actions, tie them to their specific goals above.`;
}

export async function getAISystemContext(): Promise<string> {
  const { systemContext } = await buildAIContext();
  return systemContext;
}