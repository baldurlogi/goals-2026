import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, RefreshCw, Trophy, ArrowRight, Sparkles, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  ACTIVITY_LABELS,
  calculateMacros,
  loadProfile,
  saveProfile,
  type ActivityLevel,
  type MacroTargets,
  type ScheduleView,
  type Sex,
  type UserProfile,
} from "@/features/onboarding/profileStorage";
import {
  ALL_MODULES,
  DEFAULT_MODULES,
  type ModuleId,
} from "@/features/modules/modules";
import {
  loadAIProfile,
  saveAIProfile,
  type PreferredTone,
} from "@/features/ai/aiUserProfile";
import { toast } from "sonner";

type EditableProfileFields = Pick<
  UserProfile,
  | "display_name"
  | "sex"
  | "age"
  | "weight_kg"
  | "height_cm"
  | "activity_level"
  | "onboarding_done"
  | "macro_maintain"
  | "macro_cut"
  | "default_schedule_view"
  | "daily_reading_goal"
  | "enabled_modules"
>;

function normalizeEnabledModules(
  value: UserProfile["enabled_modules"],
): ModuleId[] {
  return Array.isArray(value) && value.length > 0
    ? [...value]
    : [...DEFAULT_MODULES];
}

function PillSelect<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MacroEditor({
  targets,
  onChange,
}: {
  targets: MacroTargets;
  onChange: (t: MacroTargets) => void;
}) {
  const fields: { key: keyof MacroTargets; label: string; unit: string }[] = [
    { key: "cal", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="text-xs text-muted-foreground">
            {f.label} ({f.unit})
          </label>
          <Input
            type="number"
            min="0"
            value={targets[f.key]}
            onChange={(e) =>
              onChange({ ...targets, [f.key]: Number(e.target.value) || 0 })
            }
            className="h-9 text-sm"
          />
        </div>
      ))}
    </div>
  );
}

function ModulesEditor({
  value,
  onChange,
}: {
  value: ModuleId[];
  onChange: (next: ModuleId[]) => void;
}) {
  function toggle(id: ModuleId) {
    const next = value.includes(id)
      ? value.filter((m) => m !== id)
      : [...value, id];

    if (next.length === 0) return;
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {ALL_MODULES.map((mod) => {
          const enabled = value.includes(mod.id);
          const Icon = mod.icon;

          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => toggle(mod.id)}
              className={cn(
                "relative rounded-xl border p-4 text-left transition-all",
                enabled
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-muted/20 hover:border-primary/40",
              )}
            >
              {enabled && (
                <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}

              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-semibold">{mod.label}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                {mod.description}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length} of {ALL_MODULES.length} modules enabled
      </p>
    </div>
  );
}

type Form = {
  display_name: string;
  sex: Sex;
  age: string;
  weight_kg: string;
  height_cm: string;
  activity_level: ActivityLevel;
  macro_maintain: MacroTargets | null;
  macro_cut: MacroTargets | null;
  default_schedule_view: ScheduleView;
  daily_reading_goal: string;
  enabled_modules: ModuleId[];
};

function profileToForm(p: UserProfile): Form {
  return {
    display_name: p.display_name ?? "",
    sex: (p.sex ?? "male") as Sex,
    age: p.age?.toString() ?? "",
    weight_kg: p.weight_kg?.toString() ?? "",
    height_cm: p.height_cm?.toString() ?? "",
    activity_level: p.activity_level ?? "active",
    macro_maintain: p.macro_maintain ?? null,
    macro_cut: p.macro_cut ?? null,
    default_schedule_view: p.default_schedule_view ?? "wfh",
    daily_reading_goal: (p.daily_reading_goal ?? 20).toString(),
    enabled_modules: normalizeEnabledModules(p.enabled_modules),
  };
}

function formToFullPatch(f: Form): EditableProfileFields {
  return {
    display_name: f.display_name.trim() || null,
    sex: f.sex,
    age: f.age ? Number(f.age) : null,
    weight_kg: f.weight_kg ? Number(f.weight_kg) : null,
    height_cm: f.height_cm ? Number(f.height_cm) : null,
    activity_level: f.activity_level,
    onboarding_done: true,
    macro_maintain: f.macro_maintain ?? null,
    macro_cut: f.macro_cut ?? null,
    default_schedule_view: f.default_schedule_view,
    daily_reading_goal: Number(f.daily_reading_goal) || 20,
    enabled_modules: f.enabled_modules,
  };
}

function shallowEqualJSON(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function diffPatch(original: EditableProfileFields, next: EditableProfileFields) {
  const patch: Partial<EditableProfileFields> = {};

  const setPatchValue = <K extends keyof EditableProfileFields>(
    key: K,
    value: EditableProfileFields[K],
  ) => {
    patch[key] = value;
  };

  for (const key of Object.keys(next) as Array<keyof EditableProfileFields>) {
    if (!shallowEqualJSON(original[key], next[key])) {
      setPatchValue(key, next[key]);
    }
  }

  return patch;
}

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<Form | null>(null);

  // AI profile state
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTone, setAiTone] = useState<PreferredTone>("direct");
  const [aiGoalsSummary, setAiGoalsSummary] = useState("");
  const [aiLifestyleNotes, setAiLifestyleNotes] = useState("");
  const [aiFocusAreas, setAiFocusAreas] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      const p = await loadProfile();
      if (!alive) return;
      setProfile(p);
      setForm(p ? profileToForm(p) : null);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Load AI profile
  useEffect(() => {
    loadAIProfile().then((ai) => {
      if (!ai) return;
      setAiTone(ai.preferred_tone ?? "direct");
      setAiGoalsSummary(ai.goals_summary ?? "");
      setAiLifestyleNotes(ai.lifestyle_notes ?? "");
      setAiFocusAreas(ai.active_modules ?? []);
    });
  }, []);

  const originalFull = useMemo(() => {
    if (!profile) return null;

    const base: EditableProfileFields = {
      display_name: profile.display_name,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      age: profile.age,
      sex: profile.sex,
      activity_level: profile.activity_level,
      onboarding_done: profile.onboarding_done,
      macro_maintain: profile.macro_maintain,
      macro_cut: profile.macro_cut,
      default_schedule_view: profile.default_schedule_view,
      daily_reading_goal: profile.daily_reading_goal,
      enabled_modules: normalizeEnabledModules(profile.enabled_modules),
    };

    return base;
  }, [profile]);

  const nextFull = useMemo(() => {
    if (!form) return null;
    return formToFullPatch(form);
  }, [form]);

  const patch = useMemo(() => {
    if (!originalFull || !nextFull) return null;
    return diffPatch(originalFull, nextFull);
  }, [originalFull, nextFull]);

  const isDirty = !!patch && Object.keys(patch).length > 0;

  function update(p: Partial<Form>) {
    setSaved(false);
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }

  const canCalc =
    !!form?.weight_kg && !!form?.height_cm && !!form?.age && !!form?.sex;

  const calculated = useMemo(() => {
    if (!form || !canCalc) return null;

    return calculateMacros(
      Number(form.weight_kg),
      Number(form.height_cm),
      Number(form.age),
      form.sex,
      form.activity_level,
    );
  }, [form, canCalc]);

  async function handleSave() {
    if (!patch || Object.keys(patch).length === 0) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await saveProfile(patch);
      const refreshed = await loadProfile();
      setProfile(refreshed);
      setForm(refreshed ? profileToForm(refreshed) : null);
      setSaved(true);
    } catch (e) {
      console.error(e);
      setError("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAI() {
    setAiSaving(true);
    try {
      await saveAIProfile({
        preferred_tone: aiTone,
        goals_summary: aiGoalsSummary.trim() || null,
        lifestyle_notes: aiLifestyleNotes.trim() || null,
        active_modules: aiFocusAreas.length > 0 ? aiFocusAreas : null,
      });
      toast.success("AI settings saved");
    } catch (e) {
      console.error(e);
      toast.error("Could not save AI settings");
    } finally {
      setAiSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="text-sm text-muted-foreground">Loading profile…</div>
      </div>
    );
  }

  if (!profile || !form) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No profile found. Try signing out and back in.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Profile settings</h1>
          <p className="text-sm text-muted-foreground">
            Change anything without redoing onboarding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saved ? (
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-4 w-4" /> Saved
            </div>
          ) : null}

          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="min-w-28"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">👤 Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Your name</label>
            <Input
              value={form.display_name}
              onChange={(e) => update({ display_name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Sex</label>
            <PillSelect
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ]}
              value={form.sex}
              onChange={(v) => update({ sex: v })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Age</label>
              <Input
                type="number"
                min="10"
                max="100"
                value={form.age}
                onChange={(e) => update({ age: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Weight (kg)</label>
              <Input
                type="number"
                min="30"
                max="300"
                value={form.weight_kg}
                onChange={(e) => update({ weight_kg: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Height (cm)</label>
              <Input
                type="number"
                min="100"
                max="250"
                value={form.height_cm}
                onChange={(e) => update({ height_cm: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Activity level</label>
            <div className="space-y-2">
              {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ activity_level: value })}
                    className={cn(
                      "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                      form.activity_level === value
                        ? "border-primary bg-primary/5 font-medium text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">🧩 Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose what you want to see across your dashboard and navigation.
            Keep at least one module enabled.
          </p>

          <ModulesEditor
            value={form.enabled_modules}
            onChange={(next) => update({ enabled_modules: next })}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">🥗 Macros</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!calculated}
            onClick={() => {
              if (!calculated) return;
              update({
                macro_maintain: calculated.maintain,
                macro_cut: calculated.cut,
              });
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Recalculate
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Maintenance targets</div>
            <MacroEditor
              targets={
                form.macro_maintain ??
                calculated?.maintain ?? {
                  cal: 2400,
                  protein: 156,
                  carbs: 260,
                  fat: 68,
                }
              }
              onChange={(t) => update({ macro_maintain: t })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-semibold">Cut phase targets</div>
            <MacroEditor
              targets={
                form.macro_cut ??
                calculated?.cut ?? {
                  cal: 2000,
                  protein: 170,
                  carbs: 185,
                  fat: 58,
                }
              }
              onChange={(t) => update({ macro_cut: t })}
            />
          </div>

          {!calculated ? (
            <div className="text-xs text-muted-foreground">
              Fill in age/height/weight to enable recalculation.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">📅 Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            {
              value: "wfh",
              label: "Work from home",
              sub: "Mon / Tue — no commute, WFH schedule",
              icon: "🏠",
            },
            {
              value: "office",
              label: "Office day",
              sub: "Wed / Thu / Fri — commute included",
              icon: "🏢",
            },
            {
              value: "weekend",
              label: "Weekend",
              sub: "Sat / Sun — flexible, batch prep",
              icon: "☀️",
            },
          ] as {
            value: ScheduleView;
            label: string;
            sub: string;
            icon: string;
          }[]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ default_schedule_view: opt.value })}
              className={cn(
                "w-full rounded-xl border px-4 py-4 text-left transition-all",
                form.default_schedule_view === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.sub}</div>
                </div>
                {form.default_schedule_view === opt.value ? (
                  <Check className="ml-auto h-4 w-4 text-primary" />
                ) : null}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">📖 Reading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Daily reading goal (pages)
            </label>
            <Input
              type="number"
              min="1"
              max="200"
              className="w-40"
              value={form.daily_reading_goal}
              onChange={(e) => update({ daily_reading_goal: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[10, 15, 20, 25, 30, 50].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update({ daily_reading_goal: String(n) })}
                className={cn(
                  "rounded-full border px-5 py-2 text-sm font-semibold transition-all",
                  (Number(form.daily_reading_goal) || 20) === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50",
                )}
              >
                {n} pages
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Link to="/app/achievements">
        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 transition-all hover:bg-amber-500/10 hover:shadow-sm cursor-pointer mb-6">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">🏆 Achievements</div>
              <div className="text-sm text-muted-foreground">
                View your badges and progress
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* ── AI Coach Settings ───────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-base">AI Coach Settings</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Help your AI coach understand you better
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Preferred tone */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">Coaching tone</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                { value: "encouraging", label: "Encouraging", emoji: "🌱", desc: "Warm & positive" },
                { value: "direct",      label: "Direct",      emoji: "⚡", desc: "No-nonsense" },
                { value: "analytical",  label: "Analytical",  emoji: "📊", desc: "Data-driven" },
                { value: "tough_love",  label: "Tough Love",  emoji: "🔥", desc: "High standards" },
              ] as { value: PreferredTone; label: string; emoji: string; desc: string }[]).map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setAiTone(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                    aiTone === t.value
                      ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-violet-500/30 hover:text-foreground",
                  )}
                >
                  <span className="text-lg">{t.emoji}</span>
                  <span className="text-xs font-semibold">{t.label}</span>
                  <span className="text-[10px] opacity-70">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Goals summary */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              What are you optimising for?
            </label>
            <p className="text-xs text-muted-foreground">
              Tell the AI your big picture goal. e.g. "Lose 10kg before summer while building a side project"
            </p>
            <textarea
              value={aiGoalsSummary}
              onChange={e => setAiGoalsSummary(e.target.value)}
              placeholder="I'm trying to..."
              rows={3}
              maxLength={400}
              className={cn(
                "w-full resize-none rounded-xl border bg-muted/30 px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50",
                "transition-colors"
              )}
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {aiGoalsSummary.length}/400
            </p>
          </div>

          <Separator />

          {/* Lifestyle notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Lifestyle context
            </label>
            <p className="text-xs text-muted-foreground">
              Anything the AI should know about your life. e.g. "I work night shifts", "I have a 6-month-old", "I travel every other week"
            </p>
            <textarea
              value={aiLifestyleNotes}
              onChange={e => setAiLifestyleNotes(e.target.value)}
              placeholder="Things to know about my situation..."
              rows={3}
              maxLength={400}
              className={cn(
                "w-full resize-none rounded-xl border bg-muted/30 px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50",
                "transition-colors"
              )}
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {aiLifestyleNotes.length}/400
            </p>
          </div>

          <Separator />

          {/* Focus areas */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Focus areas</label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Which areas should the AI prioritise in suggestions?
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_MODULES.map(m => {
                const active = aiFocusAreas.includes(m.id);
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAiFocusAreas(prev =>
                      active ? prev.filter(x => x !== m.id) : [...prev, m.id]
                    )}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                      active
                        ? "border-violet-500/60 bg-violet-500/10 text-violet-300"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-violet-500/30 hover:text-foreground",
                    )}
                  >
                    <span>
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </span>
                    {m.label}
                  </button>
                );
              })}
            </div>
            {aiFocusAreas.length === 0 && (
              <p className="text-xs text-muted-foreground/60">
                No focus areas selected — AI will consider all modules equally.
              </p>
            )}
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveAI}
              disabled={aiSaving}
              className="gap-2 min-w-[140px]"
            >
              {aiSaving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {aiSaving ? "Saving…" : "Save AI settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}