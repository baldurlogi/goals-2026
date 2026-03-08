import { useEffect, useMemo, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
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
>;

// ---------- shared bits from onboarding ----------
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
// -----------------------------------------------

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

  const canCalc = !!form?.weight_kg && !!form?.height_cm && !!form?.age && !!form?.sex;
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
          <p className="text-sm text-muted-foreground">Change anything without redoing onboarding.</p>
        </div>

        <div className="flex items-center gap-2">
          {saved ? (
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-4 w-4" /> Saved
            </div>
          ) : null}
          <Button onClick={handleSave} disabled={!isDirty || saving} className="min-w-28">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      {/* --- Profile --- */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">👤 Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Your name</label>
            <Input value={form.display_name} onChange={(e) => update({ display_name: e.target.value })} />
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
              <Input type="number" min="10" max="100" value={form.age} onChange={(e) => update({ age: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Weight (kg)</label>
              <Input type="number" min="30" max="300" value={form.weight_kg} onChange={(e) => update({ weight_kg: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Height (cm)</label>
              <Input type="number" min="100" max="250" value={form.height_cm} onChange={(e) => update({ height_cm: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Activity level</label>
            <div className="space-y-2">
              {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([value, label]) => (
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
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Macros --- */}
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
              update({ macro_maintain: calculated.maintain, macro_cut: calculated.cut });
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
              targets={form.macro_maintain ?? calculated?.maintain ?? { cal: 2400, protein: 156, carbs: 260, fat: 68 }}
              onChange={(t) => update({ macro_maintain: t })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm font-semibold">Cut phase targets</div>
            <MacroEditor
              targets={form.macro_cut ?? calculated?.cut ?? { cal: 2000, protein: 170, carbs: 185, fat: 58 }}
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

      {/* --- Schedule --- */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">📅 Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {([
            { value: "wfh", label: "Work from home", sub: "Mon / Tue — no commute, WFH schedule", icon: "🏠" },
            { value: "office", label: "Office day", sub: "Wed / Thu / Fri — commute included", icon: "🏢" },
            { value: "weekend", label: "Weekend", sub: "Sat / Sun — flexible, batch prep", icon: "☀️" },
          ] as { value: ScheduleView; label: string; sub: string; icon: string }[]).map((opt) => (
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

      {/* --- Reading --- */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">📖 Reading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Daily reading goal (pages)</label>
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
    </div>
  );
}