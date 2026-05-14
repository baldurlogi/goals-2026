import { loadPRGoals } from "@/features/fitness/prGoalStorage";
import { loadWeeklySplit } from "@/features/fitness/weeklySplitStorage";
import { loadUserGoals } from "@/features/goals/userGoalStorage";
import { loadProfile } from "@/features/onboarding/profileStorage";
import {
  loadReadingHistory,
  loadReadingInputs,
} from "@/features/reading/readingStorage";
import { loadRecentSleepRecoveryEntries } from "@/features/sleep/sleepStorage";
import { loadTodos } from "@/features/todos/todoStorage";
import { loadRecentMentalWellbeingEntries } from "@/features/wellbeing/wellbeingStorage";
import { getActiveUserId } from "@/lib/activeUser";

type RetrievalPurpose = "goal" | "clarify" | "improve" | "coach" | "fitness";

type RetrievedContextOptions = {
  purpose?: RetrievalPurpose;
  maxItems?: number;
};

type RetrievalItem = {
  source: string;
  text: string;
  baseScore: number;
};

const STOP_WORDS = new Set([
  "a",
  "about",
  "all",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "get",
  "goal",
  "have",
  "i",
  "in",
  "into",
  "is",
  "it",
  "make",
  "me",
  "my",
  "of",
  "on",
  "or",
  "plan",
  "that",
  "the",
  "this",
  "to",
  "want",
  "with",
]);

function compact(value: string | null | undefined): string | null {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? text : null;
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

function scoreItem(item: RetrievalItem, queryTokens: Set<string>): number {
  if (queryTokens.size === 0) return item.baseScore;

  const itemTokens = tokenize(`${item.source} ${item.text}`);
  let overlap = 0;

  for (const token of queryTokens) {
    if (itemTokens.has(token)) overlap += 1;
  }

  return item.baseScore + overlap * 8;
}

function pushItem(
  items: RetrievalItem[],
  source: string,
  text: string | null,
  baseScore: number,
) {
  if (!text) return;
  items.push({ source, text: truncate(text, 280), baseScore });
}

function formatList(values: Array<string | null | undefined>, fallback = "none") {
  const cleaned = values.map(compact).filter((value): value is string => Boolean(value));
  return cleaned.length > 0 ? cleaned.join(", ") : fallback;
}

export async function buildAIRetrievalContext(
  query: string,
  options: RetrievedContextOptions = {},
): Promise<string> {
  const userId = getActiveUserId();
  if (!userId) return "";

  const maxItems = options.maxItems ?? 12;
  const purpose = options.purpose ?? "goal";

  const [
    profileResult,
    goalsResult,
    readingInputsResult,
    readingHistoryResult,
    todosResult,
    prGoalsResult,
    weeklySplitResult,
    sleepResult,
    wellbeingResult,
  ] = await Promise.allSettled([
    loadProfile(),
    loadUserGoals(userId),
    loadReadingInputs(userId),
    Promise.resolve(loadReadingHistory(userId)),
    loadTodos(userId),
    loadPRGoals(userId),
    loadWeeklySplit(userId),
    loadRecentSleepRecoveryEntries(userId, 7),
    loadRecentMentalWellbeingEntries(userId, 7),
  ]);

  const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
  const goals = goalsResult.status === "fulfilled" ? goalsResult.value : [];
  const readingInputs =
    readingInputsResult.status === "fulfilled" ? readingInputsResult.value : null;
  const readingHistory =
    readingHistoryResult.status === "fulfilled" ? readingHistoryResult.value : [];
  const todos = todosResult.status === "fulfilled" ? todosResult.value : [];
  const prGoals = prGoalsResult.status === "fulfilled" ? prGoalsResult.value : [];
  const weeklySplit =
    weeklySplitResult.status === "fulfilled" ? weeklySplitResult.value : null;
  const sleepEntries = sleepResult.status === "fulfilled" ? sleepResult.value : [];
  const wellbeingEntries =
    wellbeingResult.status === "fulfilled" ? wellbeingResult.value : [];

  const items: RetrievalItem[] = [];

  pushItem(
    items,
    "profile",
    [
      compact(profile?.display_name) ? `Name: ${profile?.display_name}` : null,
      compact(profile?.activity_level)
        ? `Activity level: ${profile?.activity_level}`
        : null,
      profile?.daily_reading_goal
        ? `Daily reading goal: ${profile.daily_reading_goal} pages`
        : null,
      compact(profile?.measurement_system)
        ? `Measurement system: ${profile?.measurement_system}`
        : null,
    ]
      .filter(Boolean)
      .join("; "),
    28,
  );

  for (const goal of goals.slice(0, 12)) {
    const incompleteSteps = goal.steps.filter((step) => {
      const label = compact(step.label);
      return Boolean(label);
    });
    const nextStep = incompleteSteps
      .filter((step) => step.idealFinish)
      .sort((left, right) =>
        String(left.idealFinish).localeCompare(String(right.idealFinish)),
      )[0] ?? incompleteSteps[0];

    pushItem(
      items,
      "goals",
      [
        `Goal: ${goal.title}`,
        compact(goal.subtitle),
        `Priority: ${goal.priority}`,
        nextStep
          ? `Relevant step: ${nextStep.label}${
              nextStep.idealFinish ? ` due ${nextStep.idealFinish}` : ""
            }`
          : null,
      ]
        .filter(Boolean)
        .join("; "),
      goal.priority === "high" ? 38 : goal.priority === "medium" ? 30 : 22,
    );
  }

  if (readingInputs) {
    pushItem(
      items,
      "reading",
      [
        compact(readingInputs.current.title)
          ? `Current book: ${readingInputs.current.title}${
              compact(readingInputs.current.author)
                ? ` by ${readingInputs.current.author}`
                : ""
            }`
          : null,
        compact(readingInputs.current.currentPage) &&
        compact(readingInputs.current.totalPages)
          ? `Progress: page ${readingInputs.current.currentPage}/${readingInputs.current.totalPages}`
          : null,
        compact(readingInputs.dailyGoalPages)
          ? `Daily target: ${readingInputs.dailyGoalPages} pages`
          : null,
        readingInputs.streak > 0 ? `Reading streak: ${readingInputs.streak} days` : null,
        readingInputs.upNext.length > 0
          ? `Up next: ${formatList(readingInputs.upNext.slice(0, 3).map((book) => book.title))}`
          : null,
      ]
        .filter(Boolean)
        .join("; "),
      24,
    );
  }

  const recentReading = readingHistory.slice(-7).reverse();
  if (recentReading.length > 0) {
    const pages = recentReading.reduce((sum, entry) => sum + entry.pagesRead, 0);
    pushItem(
      items,
      "reading_history",
      `Recent reading history: ${pages} pages across ${recentReading.length} logged day(s). Latest: ${recentReading[0].title} on ${recentReading[0].date}.`,
      18,
    );
  }

  const openTodos = todos.filter((todo) => !todo.done).slice(0, 6);
  if (openTodos.length > 0) {
    pushItem(
      items,
      "todos",
      `Open todos: ${formatList(openTodos.map((todo) => todo.text))}`,
      purpose === "coach" ? 34 : 18,
    );
  }

  if (prGoals.length > 0) {
    pushItem(
      items,
      "fitness_prs",
      `Fitness PR goals: ${formatList(
        prGoals.slice(0, 6).map((goal) => `${goal.label} target ${goal.goalLabel}`),
      )}`,
      purpose === "fitness" ? 42 : 20,
    );
  }

  if (weeklySplit) {
    const plannedDays = Object.entries(weeklySplit.days)
      .filter(([, day]) => compact(day.label) && day.label.toLowerCase() !== "rest")
      .map(([dayKey, day]) => `${dayKey}: ${day.label}`);

    pushItem(
      items,
      "fitness_split",
      `Weekly workout split: ${formatList(plannedDays)}. Current streak: ${weeklySplit.streak} day(s).`,
      purpose === "fitness" ? 40 : 18,
    );
  }

  if (sleepEntries.length > 0) {
    const latest = sleepEntries[0];
    pushItem(
      items,
      "sleep",
      [
        `Latest sleep log: ${latest.logDate}`,
        latest.sleepDurationMinutes !== null
          ? `duration ${latest.sleepDurationMinutes} min`
          : null,
        latest.sleepQualityScore !== null
          ? `quality ${latest.sleepQualityScore}/100`
          : null,
        latest.energyLevel !== null ? `energy ${latest.energyLevel}/5` : null,
        compact(latest.notes) ? `note: ${latest.notes}` : null,
      ]
        .filter(Boolean)
        .join("; "),
      purpose === "fitness" || purpose === "coach" ? 30 : 16,
    );
  }

  if (wellbeingEntries.length > 0) {
    const latest = wellbeingEntries[0];
    pushItem(
      items,
      "wellbeing",
      [
        `Latest wellbeing check-in: ${latest.logDate}`,
        latest.moodScore !== null ? `mood ${latest.moodScore}/5` : null,
        latest.stressLevel !== null ? `stress ${latest.stressLevel}/5` : null,
        latest.energyLevel !== null ? `energy ${latest.energyLevel}/5` : null,
        compact(latest.gratitudeEntry) ? `gratitude: ${latest.gratitudeEntry}` : null,
      ]
        .filter(Boolean)
        .join("; "),
      purpose === "coach" ? 28 : 16,
    );
  }

  const queryTokens = tokenize(query);
  const selected = items
    .map((item) => ({ ...item, score: scoreItem(item, queryTokens) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, maxItems);

  if (selected.length === 0) return "";

  return `## Retrieved user memory
These are user-scoped facts retrieved for the current AI request. Use them only when relevant, prefer the user's current prompt when there is a conflict, and do not invent missing history.
${selected.map((item) => `- [${item.source}] ${item.text}`).join("\n")}`;
}
