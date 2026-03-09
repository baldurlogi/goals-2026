import { buildAISignals, type AISignals } from "@/features/ai/aiSignals";
import {
  loadAIProfile,
  saveAIProfile,
  type AIUserProfile,
  type PreferredTone,
} from "@/features/ai/aiUserProfile";

const SNAPSHOT_TTL_MS = 30 * 60 * 1000;

export type AIContext = {
  systemContext: string;
  signals: AISignals;
  aiProfile: AIUserProfile | null;
};

function buildSystemPrompt(
  signals: AISignals,
  aiProfile: AIUserProfile | null,
): string {
  const tone = aiProfile?.preferred_tone ?? "direct";

  const toneInstructions: Record<PreferredTone, string> = {
    direct: "Be direct and concise. Lead with the action.",
    encouraging:
      "Be warm and encouraging. Celebrate progress and reduce overwhelm.",
    analytical:
      "Be precise and data-driven. Reference concrete numbers when useful.",
    tough_love:
      "Be firm, honest, and action-oriented. Push the user to stop avoiding the obvious next step without being insulting.",
  };

  const topGoals =
    signals.goals.topGoals.length > 0
      ? signals.goals.topGoals
          .map(
            (goal, index) =>
              `${index + 1}. ${goal.title} (${goal.priority ?? "unknown"} priority${
                goal.nextStepLabel ? `, next step: ${goal.nextStepLabel}` : ""
              })`,
          )
          .join("\n")
      : "No goals yet";

  const readingLine = signals.reading.currentBookTitle
    ? `Current book: ${signals.reading.currentBookTitle}${
        signals.reading.author ? ` by ${signals.reading.author}` : ""
      }. Today: ${signals.reading.minutesToday}/${signals.reading.targetMinutes} minutes. Streak: ${signals.reading.streak} day(s).`
    : `No current book set. Today: ${signals.reading.minutesToday}/${signals.reading.targetMinutes} minutes. Streak: ${signals.reading.streak} day(s).`;

  return `You are a personal life coach AI embedded inside the user's Life OS app.

## User summary
Name: ${signals.profile.displayName ?? "Unknown"}
Activity level: ${signals.profile.activityLevel ?? "Unknown"}
Preferred schedule view: ${signals.profile.preferredScheduleView ?? "Unknown"}
Daily reading goal: ${signals.profile.dailyReadingGoal ?? "Unknown"}
Plan tier: ${signals.profile.tier ?? "free"}

## Enabled modules
${signals.modules.join(", ")}

## Goals
Goal count: ${signals.goals.count}
Overdue steps: ${signals.goals.overdueSteps}
Highest priority goal: ${signals.goals.highestPriorityTitle ?? "None"}
Next step on top goal: ${signals.goals.nextStepLabel ?? "None"}
Top goals:
${topGoals}

## Nutrition
Phase: ${signals.nutrition.phase}
Meals logged today: ${signals.nutrition.mealsLoggedToday}
Calorie target: ${signals.nutrition.calorieTarget ?? "Unknown"}
Protein target: ${signals.nutrition.proteinTarget ?? "Unknown"}

## Reading
${readingLine}

## Fitness
Days since workout: ${signals.fitness.daysSinceWorkout ?? "Unknown"}
Strongest lift: ${signals.fitness.strongestLift ?? "Unknown"}
Weakest lift: ${signals.fitness.weakestLift ?? "Unknown"}

## Coaching style
${aiProfile?.personality_notes ?? "The user benefits from concrete, small, low-friction next steps."}
${aiProfile?.lifestyle_notes ?? ""}
${toneInstructions[tone]}

Keep responses specific, actionable, and tied to the user's real data.
Never repeat long summaries back to the user.`;
}

export async function buildAIContext(
  forceRefresh = false,
): Promise<AIContext> {
  const aiProfile = await loadAIProfile();

  if (
    !forceRefresh &&
    aiProfile?.last_context_snapshot &&
    aiProfile.last_context_built_at
  ) {
    const age =
      Date.now() - new Date(aiProfile.last_context_built_at).getTime();

    if (age < SNAPSHOT_TTL_MS) {
      const cachedSignals = aiProfile.last_context_snapshot as AISignals;
      return {
        systemContext: buildSystemPrompt(cachedSignals, aiProfile),
        signals: cachedSignals,
        aiProfile,
      };
    }
  }

  const signals = await buildAISignals(forceRefresh);

  await saveAIProfile({
    last_context_snapshot: signals as unknown as Record<string, unknown>,
    last_context_built_at: new Date().toISOString(),
    active_modules: signals.modules,
    preferred_step_count: aiProfile?.preferred_step_count ?? 5,
    preferred_tone: aiProfile?.preferred_tone ?? "direct",
  });

  return {
    systemContext: buildSystemPrompt(signals, aiProfile),
    signals,
    aiProfile,
  };
}

export async function getAISystemContext(
  forceRefresh = false,
): Promise<string> {
  const { systemContext } = await buildAIContext(forceRefresh);
  return systemContext;
}