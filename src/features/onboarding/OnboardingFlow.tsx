import { useState } from "react";
import { Check, ChevronRight, ChevronLeft, User, Dumbbell, CalendarDays, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  completeOnboarding,
  calculateMacros,
  ACTIVITY_LABELS,
  type Sex,
  type ActivityLevel,
  type ScheduleView,
  type MacroTargets,
} from "./profileStorage";

// ── Types ─────────────────────────────────────────────────────────────────────
type OnboardingData = {
  display_name:          string;
  sex:                   Sex;
  age:                   string;
  weight_kg:             string;
  height_cm:             string;
  activity_level:        ActivityLevel;
  macro_maintain:        MacroTargets | null;
  macro_cut:             MacroTargets | null;
  default_schedule_view: ScheduleView;
  daily_reading_goal:    string;
};

const INITIAL: OnboardingData = {
  display_name:          "",
  sex:                   "male",
  age:                   "",
  weight_kg:             "",
  height_cm:             "",
  activity_level:        "active",
  macro_maintain:        null,
  macro_cut:             null,
  default_schedule_view: "wfh",
  daily_reading_goal:    "20",
};

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Profile",   icon: User },
  { label: "Macros",    icon: Dumbbell },
  { label: "Schedule",  icon: CalendarDays },
  { label: "Reading",   icon: BookOpen },
];

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={s.label} className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
              done   && "border-primary bg-primary text-primary-foreground",
              active && "border-primary bg-primary/10 text-primary",
              !done && !active && "border-muted-foreground/30 text-muted-foreground",
            )}>
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px w-6 transition-all", i < current ? "bg-primary" : "bg-muted-foreground/20")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Shared pill selector ──────────────────────────────────────────────────────
function PillSelect<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
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

// ── Macro display card ────────────────────────────────────────────────────────
function MacroCard({ label, targets, color }: { label: string; targets: MacroTargets; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className={cn("text-xs font-semibold uppercase tracking-widest", color)}>{label}</div>
      <div className="text-2xl font-bold">{targets.cal} <span className="text-sm font-normal text-muted-foreground">kcal</span></div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Protein", value: targets.protein, unit: "g", color: "text-sky-500" },
          { label: "Carbs",   value: targets.carbs,   unit: "g", color: "text-amber-500" },
          { label: "Fat",     value: targets.fat,     unit: "g", color: "text-rose-500" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-muted/50 px-2 py-2">
            <div className={cn("text-base font-bold tabular-nums", m.color)}>{m.value}g</div>
            <div className="text-[10px] text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Editable macro row ────────────────────────────────────────────────────────
function MacroEditor({
  targets, onChange,
}: { targets: MacroTargets; onChange: (t: MacroTargets) => void }) {
  const fields: { key: keyof MacroTargets; label: string; unit: string }[] = [
    { key: "cal",     label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein",  unit: "g" },
    { key: "carbs",   label: "Carbs",    unit: "g" },
    { key: "fat",     label: "Fat",      unit: "g" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="text-xs text-muted-foreground">{f.label} ({f.unit})</label>
          <Input
            type="number" min="0"
            value={targets[f.key]}
            onChange={(e) => onChange({ ...targets, [f.key]: Number(e.target.value) || 0 })}
            className="h-9 text-sm"
          />
        </div>
      ))}
    </div>
  );
}

// ── STEPS ─────────────────────────────────────────────────────────────────────

function Step1Profile({ data, onChange }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Tell us about yourself</h2>
        <p className="mt-1 text-sm text-muted-foreground">Used to calculate your calorie and macro targets.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Your name</label>
          <Input
            placeholder="e.g. Baldur"
            value={data.display_name}
            onChange={(e) => onChange({ display_name: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Sex</label>
          <PillSelect
            options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]}
            value={data.sex}
            onChange={(v) => onChange({ sex: v })}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Age</label>
            <Input type="number" min="10" max="100" placeholder="25"
              value={data.age} onChange={(e) => onChange({ age: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Weight (kg)</label>
            <Input type="number" min="30" max="300" placeholder="78"
              value={data.weight_kg} onChange={(e) => onChange({ weight_kg: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Height (cm)</label>
            <Input type="number" min="100" max="250" placeholder="180"
              value={data.height_cm} onChange={(e) => onChange({ height_cm: e.target.value })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Activity level</label>
          <div className="space-y-2">
            {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([value, label]) => (
              <button
                key={value} type="button"
                onClick={() => onChange({ activity_level: value })}
                className={cn(
                  "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-all",
                  data.activity_level === value
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2Macros({ data, onChange }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }) {
  const canCalc = data.weight_kg && data.height_cm && data.age && data.sex;
  const calculated = canCalc
    ? calculateMacros(Number(data.weight_kg), Number(data.height_cm), Number(data.age), data.sex, data.activity_level)
    : null;

  // Use calculated if user hasn't overridden yet
  const maintain = data.macro_maintain ?? calculated?.maintain ?? { cal: 2400, protein: 156, carbs: 260, fat: 68 };
  const cut      = data.macro_cut      ?? calculated?.cut      ?? { cal: 2000, protein: 170, carbs: 185, fat: 58 };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Your macro targets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {canCalc
            ? "Calculated from your profile using the Mifflin-St Jeor formula. Adjust if needed."
            : "Enter your targets manually, or go back and fill in your profile to auto-calculate."}
        </p>
      </div>

      {calculated && (
        <div className="grid gap-3 sm:grid-cols-2">
          <MacroCard label="Maintain"  targets={maintain} color="text-emerald-500" />
          <MacroCard label="Cut phase" targets={cut}      color="text-orange-500" />
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-semibold">Maintenance targets</div>
          <MacroEditor targets={maintain} onChange={(t) => onChange({ macro_maintain: t })} />
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold">Cut phase targets <span className="text-xs font-normal text-muted-foreground">(~400 kcal deficit)</span></div>
          <MacroEditor targets={cut} onChange={(t) => onChange({ macro_cut: t })} />
        </div>
      </div>
    </div>
  );
}

function Step3Schedule({ data, onChange }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Your default day type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This sets which schedule loads by default each morning. You can always change it on the day.
        </p>
      </div>

      <div className="space-y-3">
        {([
          { value: "wfh",    label: "Work from home",  sub: "Mon / Tue — no commute, WFH schedule",  icon: "🏠" },
          { value: "office", label: "Office day",       sub: "Wed / Thu / Fri — commute included",   icon: "🏢" },
          { value: "weekend", label: "Weekend",          sub: "Sat / Sun — flexible, batch prep",     icon: "☀️" },
        ] as { value: ScheduleView; label: string; sub: string; icon: string }[]).map((opt) => (
          <button
            key={opt.value} type="button"
            onClick={() => onChange({ default_schedule_view: opt.value })}
            className={cn(
              "w-full rounded-xl border px-4 py-4 text-left transition-all",
              data.default_schedule_view === opt.value
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
              {data.default_schedule_view === opt.value && (
                <Check className="ml-auto h-4 w-4 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step4Reading({ data, onChange }: { data: OnboardingData; onChange: (p: Partial<OnboardingData>) => void }) {
  const goal = Number(data.daily_reading_goal) || 20;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Reading goal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          How many pages do you want to read every day? At 20 pages you'll finish most books in 2-3 weeks.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[10, 15, 20, 25, 30, 50].map((n) => (
            <button
              key={n} type="button"
              onClick={() => onChange({ daily_reading_goal: String(n) })}
              className={cn(
                "rounded-full border px-5 py-2 text-sm font-semibold transition-all",
                goal === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/50",
              )}
            >
              {n} pages
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-muted-foreground">Or enter a custom number</label>
          <Input
            type="number" min="1" max="200" className="w-32"
            value={data.daily_reading_goal}
            onChange={(e) => onChange({ daily_reading_goal: e.target.value })}
          />
        </div>

        {goal > 0 && (
          <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            At {goal} pages/day you'll finish a typical 300-page book in{" "}
            <span className="font-semibold text-foreground">{Math.ceil(300 / goal)} days</span>,
            and read roughly{" "}
            <span className="font-semibold text-foreground">{Math.floor((goal * 365) / 300)} books</span> this year.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep]       = useState(0);
  const [data, setData]       = useState<OnboardingData>(INITIAL);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function update(patch: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function canAdvance(): boolean {
    if (step === 0) return !!data.display_name.trim();
    return true;
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const calculated = (data.weight_kg && data.height_cm && data.age)
        ? calculateMacros(Number(data.weight_kg), Number(data.height_cm), Number(data.age), data.sex, data.activity_level)
        : null;

      await completeOnboarding({
        display_name:          data.display_name.trim(),
        sex:                   data.sex,
        age:                   data.age ? Number(data.age) : null,
        weight_kg:             data.weight_kg ? Number(data.weight_kg) : null,
        height_cm:             data.height_cm ? Number(data.height_cm) : null,
        activity_level:        data.activity_level,
        macro_maintain:        data.macro_maintain ?? calculated?.maintain ?? null,
        macro_cut:             data.macro_cut      ?? calculated?.cut      ?? null,
        default_schedule_view: data.default_schedule_view,
        daily_reading_goal:    Number(data.daily_reading_goal) || 20,
      });
      onComplete();
    } catch (e) {
      setError("Something went wrong saving your profile. Please try again.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const stepComponents = [
    <Step1Profile  key={0} data={data} onChange={update} />,
    <Step2Macros   key={1} data={data} onChange={update} />,
    <Step3Schedule key={2} data={data} onChange={update} />,
    <Step4Reading  key={3} data={data} onChange={update} />,
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Welcome 👋</h1>
          <p className="text-sm text-muted-foreground">Let's set up your dashboard. Takes about 2 minutes.</p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center">
          <StepDots current={step} />
        </div>

        {/* Step content */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {stepComponents[step]}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost" size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>

          {step < STEPS.length - 1 ? (
            <Button
              size="sm" onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleFinish} disabled={saving} className="gap-1 min-w-24">
              {saving ? "Saving…" : "Finish ✓"}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}