/**
 * One-time migration — call once after first login on your existing device.
 * Import and run from the browser console:
 *   import("/src/auth/migrateToSupabase.ts").then(m => m.migrateLocalStorageToSupabase())
 */
import { supabase } from "@/lib/supabaseClient";

export async function migrateLocalStorageToSupabase() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Auth error:", authError);
    return;
  }
  if (!user) {
    console.error("Not logged in");
    return;
  }

  const uid = user.id;
  const errors: string[] = [];

  async function upsert(table: string, data: object, conflict: string) {
    const { error } = await supabase.from(table).upsert(data, { onConflict: conflict });
    if (error) errors.push(`${table}: ${error.message}`);
  }

  // Nutrition phase
  const phase = localStorage.getItem("nutrition_phase_v1");
  if (phase) await upsert("nutrition_phase", { user_id: uid, phase }, "user_id");

  // Nutrition log
  const log = localStorage.getItem("nutrition_log_v1");
  if (log) {
    const p = JSON.parse(log);
    await upsert(
      "nutrition_logs",
      {
        user_id: uid,
        log_date: p.date,
        eaten: p.eaten ?? {},
        custom_entries: p.customEntries ?? [],
      },
      "user_id,log_date"
    );
  }

  // Saved meals
  const saved = localStorage.getItem("nutrition_saved_meals_v1");
  if (saved) {
    for (const m of JSON.parse(saved)) {
      await upsert(
        "saved_meals",
        { id: m.id, user_id: uid, name: m.name, macros: m.macros, emoji: m.emoji },
        "id"
      );
    }
  }

  // Schedule log
  const sched = localStorage.getItem("schedule_log_v1");
  if (sched) {
    const p = JSON.parse(sched);
    await upsert(
      "schedule_logs",
      {
        user_id: uid,
        log_date: p.date,
        view: p.view ?? "wfh",
        completed: p.completed ?? [],
      },
      "user_id,log_date"
    );
  }

  // ✅ Reading state (daily-life:reading:v2 / legacy v1) -> reading_state
  const reading =
    localStorage.getItem("daily-life:reading:v2") ??
    localStorage.getItem("daily-life:reading:v1");
  if (reading) {
    const state = JSON.parse(reading);
    await upsert(
      "reading_state",
      { user_id: uid, state, updated_at: new Date().toISOString() },
      "user_id"
    );
  } else {
    console.warn("No local reading found (daily-life:reading:v2/v1)");
  }

  // Todos
  const todos = localStorage.getItem("todos_v1");
  if (todos) {
    for (const t of JSON.parse(todos)) {
      await upsert(
        "todos",
        {
          id: t.id,
          user_id: uid,
          text: t.text,
          done: t.done,
          created_at: new Date(t.createdAt).toISOString(),
        },
        "id"
      );
    }
  } else {
    console.warn("No local todos found (todos_v1)");
  }

  // Fitness PRs
  const fitness = localStorage.getItem("fitness_prs_v1");
  if (fitness) {
    const p = JSON.parse(fitness);
    for (const [liftId, r] of Object.entries(p.lifts ?? {})) {
      const rec = r as { goal: number; history: object[] };
      await upsert(
        "fitness_lifts",
        { user_id: uid, lift_id: liftId, goal: rec.goal, history: rec.history },
        "user_id,lift_id"
      );
    }
    for (const [skillId, r] of Object.entries(p.skills ?? {})) {
      const rec = r as { goal: number; goal_label?: string; history: object[] };
      await upsert(
        "fitness_skills",
        {
          user_id: uid,
          skill_id: skillId,
          goal: rec.goal,
          goal_label: rec.goal_label,
          history: rec.history,
        },
        "user_id,skill_id"
      );
    }
  } else {
    console.warn("No local fitness PRs found (fitness_prs_v1)");
  }

  // ✅ Goal progress (daily-life:goals:v1)
  const goals = localStorage.getItem("daily-life:goals:v1");
  if (goals) {
    const p = JSON.parse(goals);
    for (const [goalId, done] of Object.entries(p.done ?? {})) {
      await upsert(
        "goal_progress",
        { user_id: uid, goal_id: goalId, done },
        "user_id,goal_id"
      );
    }
  } else {
    console.warn("No local goals found (daily-life:goals:v1)");
  }

  if (errors.length) {
    console.error("Migration errors:", errors);
  } else {
    console.log("✅ Migration complete — moved localStorage data to Supabase");
  }
}