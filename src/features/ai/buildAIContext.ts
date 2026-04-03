import { buildAISignals, type AISignals } from '@/features/ai/aiSignals';
import {
  loadAIProfile,
  saveAIProfile,
  type AIUserProfile,
  type PreferredTone,
} from '@/features/ai/aiUserProfile';
import { getLocalDateKey } from "@/hooks/useTodayDate";

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
  const tone = aiProfile?.preferred_tone ?? 'direct';
  const now = new Date();
  const localHour = now.getHours();
  const localTime = `${String(localHour).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  const localDate = getLocalDateKey(now);

  const toneInstructions: Record<PreferredTone, string> = {
    direct: 'Be direct and concise. Lead with the action.',
    encouraging:
      'Be warm and encouraging. Celebrate progress and reduce overwhelm.',
    analytical:
      'Be precise and data-driven. Reference concrete numbers when useful.',
    tough_love:
      'Be firm, honest, and action-oriented. Push the user to stop avoiding the obvious next step without being insulting.',
  };

  const topGoals =
    signals.goals.topGoals.length > 0
      ? signals.goals.topGoals
          .map(
            (goal, index) =>
              `${index + 1}. ${goal.title} (${goal.priority ?? 'unknown'} priority${
                goal.overdueStepLabel
                  ? `, overdue: ${goal.overdueStepLabel}${goal.overdueStepDate ? ` on ${goal.overdueStepDate}` : ''}`
                  : goal.nextStepLabel
                    ? `, next step: ${goal.nextStepLabel}${goal.nextStepDate ? ` on ${goal.nextStepDate}` : ''}`
                    : ''
              })`,
          )
          .join('\n')
      : 'No goals yet';

  const readingLine = signals.reading.currentBookTitle
    ? `Current book: ${signals.reading.currentBookTitle}${
        signals.reading.author ? ` by ${signals.reading.author}` : ''
      }. Target: ${signals.reading.targetPages} pages/day. Current progress: ${
        signals.reading.currentPage ?? 'unknown'
      }/${signals.reading.totalPages ?? 'unknown'} pages. Streak: ${
        signals.reading.streak
      } day(s).`
    : `No current book set. Target: ${signals.reading.targetPages} pages/day. Streak: ${signals.reading.streak} day(s).`;

  const aboutMe = aiProfile?.about_me?.trim();
  const extraNotes = [aiProfile?.personality_notes, aiProfile?.lifestyle_notes]
    .filter(Boolean)
    .join('\n');

  const personalContext = [
    aboutMe ? `## About the user\n${aboutMe}` : null,
    extraNotes ? `## Coaching notes\n${extraNotes}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  const sleepAverageDuration =
    typeof signals.sleep.averageSleepDurationMinutes === "number"
      ? `${Math.round(signals.sleep.averageSleepDurationMinutes)} min`
      : "Unknown";
  const latestSleepDuration =
    typeof signals.sleep.lastSleepDurationMinutes === "number"
      ? `${signals.sleep.lastSleepDurationMinutes} min`
      : "Unknown";
  const latestSleepQuality =
    typeof signals.sleep.lastSleepQualityScore === "number"
      ? `${signals.sleep.lastSleepQualityScore}/100`
      : "Unknown";
  const sleepAverageQuality =
    typeof signals.sleep.averageSleepQualityScore === "number"
      ? `${Math.round(signals.sleep.averageSleepQualityScore)}/100`
      : "Unknown";
  const sleepConsistency =
    typeof signals.sleep.bedtimeConsistencyMinutes === "number"
      ? `${Math.round(signals.sleep.bedtimeConsistencyMinutes)} min window`
      : "Unknown";

  const wellbeingAverageMood =
    typeof signals.wellbeing.averageMoodScore === "number"
      ? `${signals.wellbeing.averageMoodScore}/5`
      : "Unknown";
  const wellbeingAverageStress =
    typeof signals.wellbeing.averageStressLevel === "number"
      ? `${signals.wellbeing.averageStressLevel}/5`
      : "Unknown";
  const latestSleepEnergy =
    typeof signals.sleep.lastEnergyLevel === "number"
      ? `${signals.sleep.lastEnergyLevel}/5`
      : "Unknown";
  const latestMood =
    typeof signals.wellbeing.lastMoodScore === "number"
      ? `${signals.wellbeing.lastMoodScore}/5`
      : "Unknown";
  const latestStress =
    typeof signals.wellbeing.lastStressLevel === "number"
      ? `${signals.wellbeing.lastStressLevel}/5`
      : "Unknown";

  return `You are a personal life coach AI embedded inside the user's Life OS app.

## User summary
Name: ${signals.profile.displayName ?? 'Unknown'}
Local date: ${localDate}
Local time: ${localTime}
Activity level: ${signals.profile.activityLevel ?? 'Unknown'}
Weekly schedule: ${signals.profile.weeklyScheduleSummary ?? 'Unknown'}
Daily reading goal: ${signals.profile.dailyReadingGoal ?? 'Unknown'}
Measurement system: ${signals.profile.measurementSystem ?? 'metric'}
Date format: ${signals.profile.dateFormat ?? 'dmy'}
Time format: ${signals.profile.timeFormat ?? '24h'}
Plan tier: ${signals.profile.tier ?? 'free'}

## Enabled modules
${signals.modules.join(', ')}

## Goals
Goal count: ${signals.goals.count}
Overdue steps: ${signals.goals.overdueSteps}
Highest priority goal: ${signals.goals.highestPriorityTitle ?? 'None'}
Most urgent goal step: ${signals.goals.nextStepLabel ?? 'None'}
Top goals:
${topGoals}

## Nutrition
Phase: ${signals.nutrition.phase}
Meals logged today: ${signals.nutrition.mealsLoggedToday}
Nutrition timing windows: breakfast from 06:00, lunch from 13:00, snack from 17:00, dinner from 21:00
Calorie target: ${signals.nutrition.calorieTarget ?? 'Unknown'}
Protein target: ${signals.nutrition.proteinTarget ?? 'Unknown'}

## Reading
${readingLine}

## Fitness
Days since workout: ${signals.fitness.daysSinceWorkout ?? 'Unknown'}
Strongest lift: ${signals.fitness.strongestLift ?? 'Unknown'}
Weakest lift: ${signals.fitness.weakestLift ?? 'Unknown'}

## Sleep / Recovery
Last sleep log date: ${signals.sleep.lastLogDate ?? 'Unknown'}
Last sleep duration: ${latestSleepDuration}
Last sleep quality: ${latestSleepQuality}
Average sleep duration (recent): ${sleepAverageDuration}
Average sleep quality (recent): ${sleepAverageQuality}
Bedtime consistency (recent): ${sleepConsistency}
Morning energy from latest log: ${latestSleepEnergy}

## Mental Wellbeing
Last wellbeing check-in date: ${signals.wellbeing.lastLogDate ?? 'Unknown'}
Latest mood: ${latestMood}
Latest stress: ${latestStress}
Average mood (recent): ${wellbeingAverageMood}
Average stress (recent): ${wellbeingAverageStress}
Recent mood trend: ${signals.wellbeing.recentMoodTrend}
Recent stress trend: ${signals.wellbeing.recentStressTrend}
Journaled check-ins in recent history: ${signals.wellbeing.journalDaysLast7}

${personalContext || '## Coaching notes\nThe user benefits from concrete, small, low-friction next steps.'}

## Coaching style
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
      const cachedSignals = aiProfile.last_context_snapshot as Partial<AISignals>;
      if (!cachedSignals.sleep || !cachedSignals.wellbeing) {
        // fall through and rebuild with the latest signal shape
      } else {
      return {
        systemContext: buildSystemPrompt(cachedSignals as AISignals, aiProfile),
        signals: cachedSignals as AISignals,
        aiProfile,
      };
      }
    }
  }

  const signals = await buildAISignals(forceRefresh);

  await saveAIProfile({
    last_context_snapshot: signals as unknown as Record<string, unknown>,
    last_context_built_at: new Date().toISOString(),
    active_modules: signals.modules,
    preferred_step_count: aiProfile?.preferred_step_count ?? 5,
    preferred_tone: aiProfile?.preferred_tone ?? 'direct',
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
