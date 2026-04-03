// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function monthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type GenerateGoalRequest = {
  prompt: string;
  stepCount?: number;
};

type ChargedAction = "goal" | "coach" | "improve" | "weekly-report";

type RequestBody = GenerateGoalRequest & {
  action?:
    | "goal"
    | "clarify"
    | "lookup_book"
    | "usage"
    | "coach"
    | "improve"
    | "weekly-report";
  userContext?: string;
  improveRequest?: string;
  stepCount?: number;
  lastSuggestedModule?: string;
  title?: string;
  author?: string;
  existingGoal?: {
    title: string;
    subtitle: string;
    emoji: string;
    priority: string;
    steps: Array<{
      id: string;
      label: string;
      notes: string;
      idealFinish: string | null;
      estimatedTime: string;
      links?: string[];
    }>;
  };
  weeklyData?: {
    weekStart: string;
    weekEnd: string;
    modules: string[];
    profile?: {
      displayName?: string | null;
      activityLevel?: string | null;
      dailyReadingGoal?: number | null;
      measurementSystem?: string | null;
      dateFormat?: string | null;
      timeFormat?: string | null;
    };
    goals?: {
      total: number;
      stepsCompletedThisWeek: number;
      overdueSteps: number;
      topGoals: Array<{ title: string; priority: string; pct: number }>;
      dataCompleteness?: "complete" | "partial" | "unknown";
    };
    fitness?: {
      workoutsThisWeek?: number | null;
      daysSinceLastWorkout?: number | null;
      prsThisWeek?: number;
      strongestLift?: string | null;
      dataCompleteness?: "complete" | "partial" | "unknown";
    };
    nutrition?: {
      avgCaloriesLogged?: number;
      calorieTarget?: number | null;
      avgProteinLogged?: number;
      proteinTarget?: number | null;
      daysLogged?: number;
      dataCompleteness?: "complete" | "partial" | "unknown";
    };
    reading?: {
      currentBook?: string | null;
      streak?: number;
      pagesRead?: number | null;
      dailyGoalPages?: number;
      daysRead?: number;
      dataCompleteness?: "complete" | "partial" | "unknown";
    };
    todos?: {
      completedThisWeek?: number | null;
      totalCreatedThisWeek?: number;
      completedTotal?: number;
      openCount?: number;
      dataCompleteness?: "complete" | "partial" | "unknown";
    };
    schedule?: {
      blocksCompletedThisWeek?: number;
      totalBlocksThisWeek?: number;
      activeDays?: number;
      dataCompleteness?: "complete" | "partial" | "unknown";
    };
    sleep?: {
      avgSleepDurationMinutes?: number | null;
      avgSleepQualityScore?: number | null;
      bedtimeConsistencyMinutes?: number | null;
      loggedDays?: number;
      lastSleepDurationMinutes?: number | null;
      lastSleepQualityScore?: number | null;
      dataCompleteness?: "complete" | "partial" | "unknown";
    };
    wellbeing?: {
      avgMoodScore?: number | null;
      avgStressLevel?: number | null;
      recentMoodTrend?: "up" | "down" | "steady" | "unknown";
      recentStressTrend?: "up" | "down" | "steady" | "unknown";
      checkInDays?: number;
      journalDays?: number;
      gratitudeDays?: number;
      dataCompleteness?: "complete" | "partial" | "unknown";
    };
  };
};

type UsageReservation = {
  prompts_used: number;
  monthly_limit: number;
  remaining: number;
  tier: string;
  allowed: boolean;
};

function actionNeedsAnthropic(
  action: RequestBody["action"] | undefined,
): boolean {
  return (
    action === undefined ||
    action === "goal" ||
    action === "clarify" ||
    action === "lookup_book" ||
    action === "coach" ||
    action === "improve" ||
    action === "weekly-report"
  );
}

function monthlyLimitForTier(tier: string): number {
  if (tier === "pro") return 200;
  if (tier === "pro_max") return 1000;
  return 10;
}

type AnthropicJsonResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: Response };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeAnthropicJsonText(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractFirstJsonBlock(text: string): string | null {
  let start = -1;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === "{" || char === "[") {
      start = index;
      break;
    }
  }

  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let opening: "{" | "[" | null = null;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{" || char === "[") {
      if (depth === 0) {
        opening = char;
      }
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;

      if (depth === 0) {
        const closingMatches =
          (opening === "{" && char === "}") ||
          (opening === "[" && char === "]");

        if (!closingMatches) return null;
        return text.slice(start, index + 1);
      }

      if (depth < 0) return null;
    }
  }

  return null;
}

function parseJsonWithFallback<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const extracted = extractFirstJsonBlock(text);
    if (!extracted) return null;

    try {
      return JSON.parse(extracted) as T;
    } catch {
      return null;
    }
  }
}

async function parseAnthropicJsonResponse<T = unknown>(
  res: Response,
  failureLabel: string,
): Promise<AnthropicJsonResult<T>> {
  const raw = await res.text();

  if (!res.ok) {
    return {
      ok: false as const,
      response: jsonResponse(
        { error: `${failureLabel} request failed`, details: raw },
        res.status,
      ),
    };
  }

  let data: { content?: Array<{ type: string; text?: string }> };
  try {
    data = JSON.parse(raw);
  } catch {
    return {
      ok: false as const,
      response: jsonResponse(
        { error: `${failureLabel} returned non-JSON`, details: raw },
        500,
      ),
    };
  }

  const text = sanitizeAnthropicJsonText(
    (data.content ?? [])
      .map((c) => (c.type === "text" ? c.text ?? "" : ""))
      .join(""),
  );

  const parsed = parseJsonWithFallback<T>(text);

  if (parsed !== null) {
    return {
      ok: true as const,
      value: parsed,
    };
  }

  {
    return {
      ok: false as const,
      response: jsonResponse(
        { error: `${failureLabel} returned invalid JSON`, raw_text: text },
        500,
      ),
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ error: "Missing Supabase function secrets" }, 500);
    }

    const body: RequestBody = await req.json();
    const { action = "goal" } = body;

    if (actionNeedsAnthropic(action) && !anthropicApiKey) {
      return jsonResponse(
        { error: "Missing ANTHROPIC_API_KEY secret" },
        500,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }

    const {
      userContext,
      improveRequest,
      lastSuggestedModule,
      existingGoal,
      weeklyData,
    } = body;

    const month = monthKey();

    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .single();

    const tier = (profile?.tier as string) ?? "free";

    async function readCurrentUsage(): Promise<UsageReservation> {
      const monthly_limit = monthlyLimitForTier(tier);

      const usageQueries = [
        supabase
          .from("ai_prompt_usage")
          .select("prompts_used")
          .eq("user_id", user.id)
          .eq("month", month)
          .maybeSingle(),
        supabase
          .from("ai_usage")
          .select("prompts_used")
          .eq("user_id", user.id)
          .eq("month", month)
          .maybeSingle(),
      ] as const;

      for (const query of usageQueries) {
        const { data, error } = await query;

        if (error) continue;

        const prompts_used =
          typeof data?.prompts_used === "number"
            ? Math.max(0, Number(data.prompts_used))
            : 0;

        return {
          prompts_used,
          monthly_limit,
          remaining: Math.max(0, monthly_limit - prompts_used),
          tier,
          allowed: prompts_used < monthly_limit,
        };
      }

      return {
        prompts_used: 0,
        monthly_limit,
        remaining: monthly_limit,
        tier,
        allowed: true,
      };
    }

    async function reservePrompt(): Promise<UsageReservation> {
      const { data, error } = await supabase.rpc("reserve_ai_prompt", {
        p_user_id: user.id,
        p_month: month,
      });

      if (error) {
        throw new Error(`Failed to reserve AI prompt: ${error.message}`);
      }

      const row = Array.isArray(data) ? data[0] : data;

      if (!row) {
        throw new Error("Failed to reserve AI prompt: empty response");
      }

      return {
        prompts_used: Number(row.prompts_used ?? 0),
        monthly_limit: Number(row.monthly_limit ?? 10),
        remaining: Number(row.remaining ?? 0),
        tier: String(row.tier ?? "free"),
        allowed: Boolean(row.allowed),
      };
    }

    async function reserveChargedActionOrReturn(
      chargedAction: ChargedAction,
    ): Promise<{ usage: UsageReservation } | { response: Response }> {
      const usage = await reservePrompt();

      if (!usage.allowed) {
        return {
          response: jsonResponse(
            {
              error: "monthly_limit_reached",
              message: `You've used all ${usage.monthly_limit} AI prompts for this month on the ${usage.tier} plan.`,
              prompts_used: usage.prompts_used,
              monthly_limit: usage.monthly_limit,
              tier: usage.tier,
              upgrade_required: usage.tier !== "pro_max",
              action: chargedAction,
            },
            429,
          ),
        };
      }

      return { usage };
    }

    // ── CLARIFY action (no usage charge) ─────────────────────────────────
    if (action === "clarify") {
      const { prompt } = body;

      if (!prompt?.trim()) {
        return jsonResponse({ error: "prompt required" }, 400);
      }

      const clarifySystem = `You are a goal planning assistant. A user has described a goal and you need to ask 2-3 targeted follow-up questions to gather the context needed to build a highly personalised, detailed action plan.

Return ONLY valid JSON — no markdown, no explanation:
{
  "questions": [
    {
      "id": "q1",
      "question": "string (short, direct question)",
      "hint": "string (optional — one sentence explaining why this matters, max 12 words)",
      "placeholder": "string (example answer to show in the input field)"
    }
  ]
}

Rules:
- Return exactly 2-3 questions, never more
- Questions must be specific to the goal described — never generic
- Ask about: current baseline/level, constraints (deadline, budget, time available), specific sub-goals or preferences
- Do NOT ask about things already stated in the goal
- Keep questions short — one sentence each
- Placeholder should be a concrete example answer, not "e.g. ..."
- hint is optional — only include if it genuinely helps the user understand why you're asking`;

      const clarifyRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          system: clarifySystem,
          messages: [{ role: "user", content: `Goal: ${prompt.trim()}` }],
        }),
      });

      const parsed = await parseAnthropicJsonResponse<{ questions?: unknown[] }>(
        clarifyRes,
        "Clarification",
      );

      if (parsed.ok === false) {
        return parsed.response;
      }

      return jsonResponse({ questions: parsed.value.questions ?? [] });
    }

    // ── LOOKUP_BOOK action (no usage charge) ──────────────────────────────
    if (action === "lookup_book") {
      const title = (body.title ?? "").trim();
      const author = (body.author ?? "").trim();

      if (!title && !author) {
        return jsonResponse({ pages: null });
      }

      const bookQuery = author ? `"${title}" by ${author}` : `"${title}"`;

      const lookupRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 80,
          messages: [
            {
              role: "user",
              content: `Look up this book: ${bookQuery}. Reply with ONLY a JSON object like {"author": "Cal Newport", "pages": 296}. Use null for any field you are not confident about. Never guess.`,
            },
          ],
        }),
      });

      const parsed = await parseAnthropicJsonResponse<{
        pages?: unknown;
        author?: unknown;
      }>(lookupRes, "Book lookup");

      if (parsed.ok === false) {
        return jsonResponse({ pages: null });
      }

      const pages =
        typeof parsed.value.pages === "number" && parsed.value.pages > 0
          ? parsed.value.pages
          : null;

      const resolvedAuthor =
        typeof parsed.value.author === "string" && parsed.value.author.trim()
          ? parsed.value.author.trim()
          : null;

      return jsonResponse({ pages, author: resolvedAuthor });
    }

    // ── USAGE action (no usage charge) ───────────────────────────────────
    if (action === "usage") {
      const usage = await readCurrentUsage();
      return jsonResponse({ usage });
    }

    // ── COACH action ──────────────────────────────────────────────────────
    if (action === "coach") {
      if (!userContext || !userContext.trim()) {
        return jsonResponse(
          { error: "userContext required for coach action" },
          400,
        );
      }

      const reserved = await reserveChargedActionOrReturn("coach");
      if ("response" in reserved) return reserved.response;
      const { usage } = reserved;

      const rotationRule = lastSuggestedModule
        ? `ROTATION RULE: The last suggestion was about "${lastSuggestedModule}". You MUST suggest a completely different life area this time. Do not mention ${lastSuggestedModule} at all.`
        : "Choose the highest-impact action across any area: goals, fitness, reading, nutrition, sleep, wellbeing, todos.";

      const coachSystem = `${userContext.trim()}

---

You are a concise AI life coach embedded in the user's personal dashboard.
Your job: suggest ONE specific next action the user should take RIGHT NOW based on their data above.

${rotationRule}

Rules:
- Return ONLY valid JSON — no markdown, no explanation
- Schema: { "action": "string", "reason": "string", "href": "string", "emoji": "string", "module": "string" }
- "action": one punchy sentence, max 12 words, starts with a verb
- "reason": one sentence of context/motivation, max 15 words
- "href": the most relevant app route. One of: /app/nutrition, /app/fitness, /app/reading, /app/goals, /app/schedule, /app/sleep, /app/wellbeing, /app/todos, /app/upcoming
- "emoji": single relevant emoji
- "module": which area this is about. One of: nutrition, fitness, reading, goals, schedule, sleep, wellbeing, todos
- Be specific — reference actual numbers, goal names, book titles, or streaks from the context above
- If there are overdue goal steps, prefer an overdue goal step over anything else unless the user is missing essential setup data
- If there are no overdue steps but there are goal steps due today, prefer a due-today goal step over any goal step due tomorrow or later
- Never suggest a goal step due in 2+ days when an overdue or due-today goal step exists
- Respect the user's local time and nutrition timing windows from the context above
- Do NOT suggest logging lunch before 13:00 local time, snack before 17:00 local time, or dinner before 21:00 local time
- Do NOT suggest a "third meal", "fourth meal", snack, or dinner early just because multiple meals are already logged
- Spread suggestions across life areas — goals progress, reading streak, fitness PRs, sleep consistency, wellbeing check-ins, and upcoming tasks all matter equally`;

      const coachRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: coachSystem,
          messages: [{ role: "user", content: "What should I do right now?" }],
        }),
      });

      const parsed = await parseAnthropicJsonResponse<unknown>(
        coachRes,
        "Coach",
      );

      if (parsed.ok === false) {
        return parsed.response;
      }

      return jsonResponse({
        suggestion: parsed.value,
        usage,
      });
    }

    // ── IMPROVE action ────────────────────────────────────────────────────
    if (action === "improve") {
      if (!existingGoal) {
        return jsonResponse(
          { error: "existingGoal required for improve action" },
          400,
        );
      }

      const reserved = await reserveChargedActionOrReturn("improve");
      if ("response" in reserved) return reserved.response;
      const { usage } = reserved;

      const today = new Date().toISOString().slice(0, 10);
      const contextBlock = userContext?.trim()
        ? `${userContext.trim()}\n\n---\n\n`
        : "";
      const improveRequestBlock = improveRequest?.trim()
        ? `The user specifically wants these improvements:\n${improveRequest.trim()}\n\n`
        : "";

      const currentStepsJson = JSON.stringify(
        existingGoal.steps.map((s, i) => ({
          index: i + 1,
          id: s.id,
          label: s.label,
          notes: s.notes,
          idealFinish: s.idealFinish,
          estimatedTime: s.estimatedTime,
          links: s.links ?? [],
        })),
        null,
        2,
      );

      const improveSystem = `${contextBlock}You are an expert goal-planning coach. The user has an existing goal with steps and wants you to improve it.

${improveRequestBlock}Existing goal:
- Title: "${existingGoal.title}"
- Subtitle: "${existingGoal.subtitle}"
- Priority: ${existingGoal.priority}
- Current steps:
${currentStepsJson}

Your job: Return a SMALL, focused set of proposed changes to the steps. Do not rewrite the whole goal.

You may:
- Update existing steps that should change
- Add a small number of missing steps that are clearly needed
- Remove a redundant step only if that directly helps the user's request
- Tighten notes, dates, links, and estimated time for the affected steps

If the user gave a specific improvement request:
- Prioritize that request over general cleanup
- Focus changes on the steps most relevant to that request
- Leave unrelated steps mostly unchanged unless a small supporting tweak is clearly helpful
- Mention the requested focus in the summary when relevant

Return ONLY valid JSON — no markdown, no explanation:
{
  "changes": [
    {
      "id": "string (unique id for this proposed change; use target step id for updates/removals, use new_1/new_2 for additions)",
      "action": "update" | "add" | "remove",
      "targetStepId": "string or null (existing step id for update/remove, null for add)",
      "insertAfterStepId": "string or null (for adds, place it after this existing step id when possible)",
      "label": "string (required for add/update, empty string for remove)",
      "notes": "string (required for add/update, specific guidance with a final 'Done when:' sentence, max 30 words; empty string for remove)",
      "idealFinish": "YYYY-MM-DD or null",
      "estimatedTime": "string (e.g. '2 hours', '30 min', 'ongoing') or empty string; empty for remove",
      "links": ["https://example.com", "https://example.com/resource"],
      "reason": "string (brief reason for this proposed change, max 14 words)"
    }
  ],
  "summary": "string (one sentence explaining the key improvements made, max 20 words)"
}

Rules:
- Return 1 to 6 changes total, never the full step list
- Do not return unchanged steps
- Prefer updating existing steps over adding new ones
- Only add a step when it clearly helps the user's specific request
- Only remove a step when it is redundant or conflicts with the user's request
- For update/remove, targetStepId must match an existing step id
- For add, targetStepId must be null and insertAfterStepId should reference a related existing step when possible
- Today's date is ${today}
- Put useful URLs in links, not inside notes
- When links are not helpful, return an empty array
- notes must be a single plain-text sentence or two on one line, not bullets or markdown
- Escape any double quotes inside JSON strings properly
- Do not add any text before or after the JSON object
- Keep the rest of the goal untouched outside these proposed changes
- If user context is provided, tailor steps to their specific situation`;

      const improveRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          temperature: 0,
          system: improveSystem,
          messages: [{ role: "user", content: "Improve my goal steps." }],
        }),
      });

      const parsed = await parseAnthropicJsonResponse<unknown>(
        improveRes,
        "Improve",
      );

      if (parsed.ok === false) {
        return parsed.response;
      }

      return jsonResponse({
        improved: parsed.value,
        usage,
      });
    }

    // ── WEEKLY REPORT action ──────────────────────────────────────────────
    if (action === "weekly-report") {
      if (!weeklyData) {
        return jsonResponse(
          { error: "weeklyData required for weekly-report action" },
          400,
        );
      }

      if (tier !== "pro_max" && tier !== "pro") {
        return jsonResponse(
          {
            error: "upgrade_required",
            message: "The AI Weekly Report is available on Pro and Pro Max plans.",
            upgrade_required: true,
            tier,
          },
          403,
        );
      }

      const reserved = await reserveChargedActionOrReturn("weekly-report");
      if ("response" in reserved) return reserved.response;
      const { usage } = reserved;

      const d = weeklyData;
      const contextBlock = userContext?.trim()
        ? `${userContext.trim()}\n\n---\n\n`
        : "";

      const fitness = (d.fitness ?? {}) as Record<string, unknown>;
      const nutrition = (d.nutrition ?? {}) as Record<string, unknown>;
      const reading = (d.reading ?? {}) as Record<string, unknown>;
      const todos = (d.todos ?? {}) as Record<string, unknown>;
      const schedule = (d.schedule ?? {}) as Record<string, unknown>;
      const sleep = (d.sleep ?? {}) as Record<string, unknown>;
      const wellbeing = (d.wellbeing ?? {}) as Record<string, unknown>;

      const dataBlock = `Week: ${d.weekStart} to ${d.weekEnd}
Enabled modules: ${d.modules.join(", ")}
User: ${d.profile?.displayName ?? "Unknown"}, activity: ${d.profile?.activityLevel ?? "unknown"}
Preferences: measurement ${d.profile?.measurementSystem ?? "metric"}, date ${d.profile?.dateFormat ?? "dmy"}, time ${d.profile?.timeFormat ?? "24h"}

GOALS (${d.goals?.total ?? 0} total)
- Steps completed this week: ${d.goals?.stepsCompletedThisWeek ?? 0}
- Overdue steps: ${d.goals?.overdueSteps ?? 0}
- Top goals: ${(d.goals?.topGoals ?? [])
  .map((g) => `${g.title} (${g.priority}, ${g.pct}% done)`)
  .join("; ") || "none"}
- Data completeness: ${d.goals?.dataCompleteness ?? "complete"}

FITNESS
- Workouts this week: ${typeof fitness.workoutsThisWeek === "number" ? fitness.workoutsThisWeek : "unknown"}
- Days since last workout: ${typeof fitness.daysSinceLastWorkout === "number" ? fitness.daysSinceLastWorkout : "unknown"}
- Strongest lift: ${typeof fitness.strongestLift === "string" ? fitness.strongestLift : "none"}
- Data completeness: ${typeof fitness.dataCompleteness === "string" ? fitness.dataCompleteness : "unknown"}
- PRs set this week: ${typeof fitness.prsThisWeek === "number" ? fitness.prsThisWeek : "unknown"}

NUTRITION
- Days logged: ${typeof nutrition.daysLogged === "number" ? nutrition.daysLogged : "unknown"}/7
- Avg calories: ${typeof nutrition.avgCaloriesLogged === "number" ? nutrition.avgCaloriesLogged : "unknown"} / target ${typeof nutrition.calorieTarget === "number" ? nutrition.calorieTarget : "unknown"}
- Avg protein: ${typeof nutrition.avgProteinLogged === "number" ? nutrition.avgProteinLogged : "unknown"}g / target ${typeof nutrition.proteinTarget === "number" ? nutrition.proteinTarget : "unknown"}g
- Data completeness: ${typeof nutrition.dataCompleteness === "string" ? nutrition.dataCompleteness : "unknown"}

READING
- Pages read this week: ${typeof reading.pagesRead === "number" ? reading.pagesRead : "unknown"}
- Daily goal: ${typeof reading.dailyGoalPages === "number" ? reading.dailyGoalPages : "unknown"} pages/day
- Days read this week: ${typeof reading.daysRead === "number" ? reading.daysRead : "unknown"}
- Streak: ${typeof reading.streak === "number" ? reading.streak : 0} days
- Current book: ${typeof reading.currentBook === "string" ? reading.currentBook : "none"}
- Data completeness: ${typeof reading.dataCompleteness === "string" ? reading.dataCompleteness : "unknown"}

TODOS
- Completed this week: ${typeof todos.completedThisWeek === "number" ? todos.completedThisWeek : "unknown"}
- Total currently completed: ${typeof todos.completedTotal === "number" ? todos.completedTotal : "unknown"}
- Open todos: ${typeof todos.openCount === "number" ? todos.openCount : "unknown"}
- Created this week: ${typeof todos.totalCreatedThisWeek === "number" ? todos.totalCreatedThisWeek : "unknown"}
- Data completeness: ${typeof todos.dataCompleteness === "string" ? todos.dataCompleteness : "unknown"}

SCHEDULE
- Blocks completed: ${typeof schedule.blocksCompletedThisWeek === "number" ? schedule.blocksCompletedThisWeek : "unknown"}
- Total blocks tracked: ${typeof schedule.totalBlocksThisWeek === "number" ? schedule.totalBlocksThisWeek : "unknown"}
- Active days tracked: ${typeof schedule.activeDays === "number" ? schedule.activeDays : "unknown"}
- Data completeness: ${typeof schedule.dataCompleteness === "string" ? schedule.dataCompleteness : "unknown"}

SLEEP / RECOVERY
- Nights logged: ${typeof sleep.loggedDays === "number" ? sleep.loggedDays : "unknown"}/7
- Avg sleep duration: ${typeof sleep.avgSleepDurationMinutes === "number" ? sleep.avgSleepDurationMinutes : "unknown"} minutes
- Avg sleep quality: ${typeof sleep.avgSleepQualityScore === "number" ? sleep.avgSleepQualityScore : "unknown"} / 100
- Bedtime consistency window: ${typeof sleep.bedtimeConsistencyMinutes === "number" ? sleep.bedtimeConsistencyMinutes : "unknown"} minutes
- Latest sleep duration: ${typeof sleep.lastSleepDurationMinutes === "number" ? sleep.lastSleepDurationMinutes : "unknown"} minutes
- Latest sleep quality: ${typeof sleep.lastSleepQualityScore === "number" ? sleep.lastSleepQualityScore : "unknown"} / 100
- Data completeness: ${typeof sleep.dataCompleteness === "string" ? sleep.dataCompleteness : "unknown"}

MENTAL WELLBEING
- Check-ins this week: ${typeof wellbeing.checkInDays === "number" ? wellbeing.checkInDays : "unknown"}/7
- Avg mood: ${typeof wellbeing.avgMoodScore === "number" ? wellbeing.avgMoodScore : "unknown"} / 5
- Avg stress: ${typeof wellbeing.avgStressLevel === "number" ? wellbeing.avgStressLevel : "unknown"} / 5
- Recent mood trend: ${typeof wellbeing.recentMoodTrend === "string" ? wellbeing.recentMoodTrend : "unknown"}
- Recent stress trend: ${typeof wellbeing.recentStressTrend === "string" ? wellbeing.recentStressTrend : "unknown"}
- Journal days: ${typeof wellbeing.journalDays === "number" ? wellbeing.journalDays : "unknown"}
- Gratitude days: ${typeof wellbeing.gratitudeDays === "number" ? wellbeing.gratitudeDays : "unknown"}
- Data completeness: ${typeof wellbeing.dataCompleteness === "string" ? wellbeing.dataCompleteness : "unknown"}`;

      const reportSystem = `${contextBlock}You are an insightful AI life coach generating a weekly life review report.

Here is the user's data for the week:
${dataBlock}

Generate a structured weekly report in ONLY valid JSON — no markdown, no explanation:
{
  "headline": "string (one punchy sentence summarising the week, max 12 words)",
  "overallScore": number (0-100, honest holistic score for the week),
  "moduleScores": [
    {
      "module": "string (goals|fitness|nutrition|reading|todos|schedule|sleep|wellbeing)",
      "label": "string (display name)",
      "emoji": "string",
      "score": number (0-100),
      "oneliner": "string (one sentence, max 12 words, specific to their data)"
    }
  ],
  "wins": [
    { "title": "string (max 8 words)", "detail": "string (1-2 sentences, specific, reference actual numbers)" }
  ],
  "missedTargets": [
    { "title": "string (max 8 words)", "detail": "string (honest but constructive, 1-2 sentences)" }
  ],
  "patterns": [
    { "title": "string (max 8 words)", "detail": "string (insight about a behavioural trend, 1-2 sentences)" }
  ],
  "nextWeekFocus": [
    { "priority": number (1-3), "action": "string (starts with verb, max 10 words)", "why": "string (max 12 words)", "href": "string (/app/goals|/app/fitness|/app/nutrition|/app/reading|/app/todos|/app/schedule|/app/sleep|/app/wellbeing)" }
  ],
  "closingNote": "string (warm, motivating closing sentence, personalised, max 20 words)"
}

Rules:
- wins: 2-4 items
- missedTargets: 1-3 items
- patterns: 2-3 items
- nextWeekFocus: exactly 3 items
- moduleScores: only include enabled modules
- overallScore: be honest — 60-75 is a good week, 80+ is exceptional
- Make everything specific to actual numbers when numbers are trustworthy
- If a metric is unknown, partial, or missing, do NOT treat it as zero
- Never say the user read 0 pages / did 0 workouts / completed 0 todos unless the data explicitly confirms zero
- If module data is partial, mention uncertainty briefly instead of making a false claim
- Do not heavily penalize a module solely because tracking data is incomplete
- Reward strong signals like streaks, days logged, PRs, completed blocks, consistent sleep logging, journaling, or visible goal progress
- closingNote should feel personal`;

      const reportRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          system: reportSystem,
          messages: [{ role: "user", content: "Generate my weekly life report." }],
        }),
      });

      const parsed = await parseAnthropicJsonResponse<unknown>(
        reportRes,
        "Weekly report",
      );

      if (parsed.ok === false) {
        return parsed.response;
      }

      await supabase.from("ai_weekly_reports").upsert(
        {
          user_id: user.id,
          week_start: d.weekStart,
          report: parsed.value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,week_start" },
      );

      return jsonResponse({
        report: parsed.value,
        weekStart: d.weekStart,
        usage,
      });
    }

    // ── GOAL action (default) ─────────────────────────────────────────────
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return jsonResponse({ error: "Missing or invalid prompt" }, 400);
    }

    const reserved = await reserveChargedActionOrReturn("goal");
    if ("response" in reserved) return reserved.response;
    const { usage } = reserved;

    const today = new Date().toISOString().slice(0, 10);
    const contextBlock =
      userContext && typeof userContext === "string" && userContext.trim()
        ? `${userContext.trim()}\n\n---\n\n`
        : "";

    const systemPrompt = `${contextBlock}You are an expert goal-planning coach. Your job is to turn a user's goal into a specific, detailed, actionable step-by-step plan.

Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "title": "string (concise, 3-6 words)",
  "subtitle": "string (one sentence describing the goal)",
  "emoji": "string (single relevant emoji)",
  "priority": "high" | "medium" | "low",
  "steps": [
    {
      "label": "string (action-oriented step, starts with verb)",
      "notes": "string (specific guidance ending with a clear 'Done when:' sentence)",
      "idealFinish": "YYYY-MM-DD or null",
      "estimatedTime": "string (e.g. '2 hours', '30 min', 'ongoing') or empty string",
      "links": ["https://example.com", "https://example.com/resource"]
    }
  ]
}

STEP COUNT: Use as many steps as the goal genuinely requires.
- Simple habits or small goals: 6-10 steps
- Medium goals (fitness transformation, learning a skill): 10-16 steps
- Large or complex goals (career change, business launch, major application): 16-30 steps
- Never artificially limit steps — a detailed plan is always better than a vague one

STEP QUALITY RULES (critical):
- Every step label must start with a verb and be specific enough that the user knows exactly what to do
- BAD: "Establish skincare routine" — too vague, no clear action
- GOOD: "Buy cleanser, moisturiser, and SPF 30+ sunscreen" — specific, completable
- BAD: "Optimize nutrition" — could mean anything
- GOOD: "Calculate your daily calorie and protein targets using a TDEE calculator" — one clear action

NOTES FIELD — must include ALL of the following when relevant:
1. Specific sub-actions or bullet points explaining HOW to do the step
2. Concrete examples, tools, or resources (e.g. "Use Cronometer or MyFitnessPal", "Search for NASM or ACE certified PTs")
3. "Done when:" criteria — one sentence that tells the user exactly when this step is complete
   Example: "Done when: you have a written list of 5 programs with deadlines saved somewhere."
   Example: "Done when: you have logged at least one meal and set your calorie goal."

LINKS FIELD:
- Put any useful URLs in the links array
- Use full absolute URLs starting with https://
- Do not paste raw URLs into notes unless absolutely unavoidable
- If a step does not need links, return an empty array

DATES: Spread idealFinish dates realistically from today (${today}). Earlier steps sooner, later steps further out. Use null only if the step is truly open-ended.

PRIORITY:
- high = life-changing, time-sensitive, or the user's stated main focus
- medium = important but not urgent
- low = nice-to-have

PERSONALISATION: If userContext or follow-up answers are provided above, tailor every step to their specific situation, level, constraints, and timeline. Reference their actual details — don't give generic advice.`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: `User goal: ${prompt.trim()}` }],
      }),
    });

    const raw = await anthropicRes.text();

    if (!anthropicRes.ok) {
      return jsonResponse(
        {
          error: "Anthropic request failed",
          status: anthropicRes.status,
          details: raw,
        },
        anthropicRes.status,
      );
    }

    let anthropicData: {
      content?: Array<{ type: string; text?: string }>;
      stop_reason?: string | null;
    } | null = null;

    try {
      anthropicData = JSON.parse(raw) as {
        content?: Array<{ type: string; text?: string }>;
        stop_reason?: string | null;
      };
    } catch {
      return jsonResponse(
        { error: "Anthropic returned non-JSON response", details: raw },
        500,
      );
    }

    if (!anthropicData) {
      return jsonResponse(
        { error: "Anthropic returned empty response" },
        500,
      );
    }

    const text = sanitizeAnthropicJsonText(
      (anthropicData.content ?? [])
        .map((c) => (c.type === "text" ? c.text ?? "" : ""))
        .join(""),
    );

    let parsedGoal: unknown;
    try {
      parsedGoal = JSON.parse(text);
    } catch {
      return jsonResponse(
        {
          error: "Claude returned invalid goal JSON",
          raw_text: text,
          stop_reason: anthropicData.stop_reason ?? null,
        },
        500,
      );
    }

    return jsonResponse({
      goal: parsedGoal,
      usage,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      500,
    );
  }
});
