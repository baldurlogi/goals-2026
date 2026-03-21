import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateMacros,
  WEEKDAY_ORDER,
  type WeekdayKey,
  type WeeklyScheduleValue,
} from "@/features/onboarding/profileStorage";
import { useProfileState, useSaveProfileMutation } from "@/features/onboarding/useProfileQuery";
import { loadAIProfile, saveAIProfile, type PreferredTone } from "@/features/ai/aiUserProfile";
import { toast } from "sonner";
import { AIUsageDetailsCard } from "@/features/subscription/AIUsageDetailsCard";
import { ProfileStateCard } from "@/features/onboarding/components/ProfileStateCard";
import { validateClampedNumberInput } from "@/lib/numericInput";
import { BodyMetricsSection } from "./components/BodyMetricsSection";
import { IdentitySection } from "./components/IdentitySection";
import { ModulesSection } from "./components/ModulesSection";
import { MacrosSection } from "./components/MacrosSection";
import { AISettingsSection } from "./components/AISettingsSection";
import {
  diffPatch,
  formToFullPatch,
  normalizeEnabledModules,
  profileToForm,
  type EditableProfileFields,
  type ProfileForm,
} from "./utils/profileForm";

const DAY_LABELS: Record<WeekdayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const SCHEDULE_OPTIONS: { value: WeeklyScheduleValue; label: string; description: string }[] = [
  { value: "office", label: "Office", description: "Mostly in person" },
  { value: "wfh", label: "WFH", description: "Mostly remote" },
  { value: "hybrid", label: "Hybrid", description: "Mixed day" },
  { value: "off", label: "Off", description: "Day off" },
];

export function ProfilePage() {
  const { profile, isAuthLoading, isProfileLoading, isMissingProfile, error: loadError, isFetching, refetch } = useProfileState();
  const saveProfileMutation = useSaveProfileMutation();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [readingGoalError, setReadingGoalError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm | null>(null);

  const [aiSaving, setAiSaving] = useState(false);
  const [aiAboutMe, setAiAboutMe] = useState("");
  const [aiTone, setAiTone] = useState<PreferredTone>("direct");
  const [aiGoalsSummary, setAiGoalsSummary] = useState("");
  const [aiLifestyleNotes, setAiLifestyleNotes] = useState("");
  const [aiFocusAreas, setAiFocusAreas] = useState<string[]>([]);

  useEffect(() => {
    setForm(profile ? profileToForm(profile) : null);
  }, [profile]);

  useEffect(() => {
    loadAIProfile().then((ai) => {
      if (!ai) return;
      setAiAboutMe(ai.about_me ?? "");
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
      weekly_schedule: profile.weekly_schedule,
      daily_reading_goal: profile.daily_reading_goal,
      enabled_modules: normalizeEnabledModules(profile.enabled_modules),
    };
    return base;
  }, [profile]);

  const nextFull = useMemo(() => (form ? formToFullPatch(form) : null), [form]);
  const patch = useMemo(() => (originalFull && nextFull ? diffPatch(originalFull, nextFull) : null), [nextFull, originalFull]);
  const isDirty = !!patch && Object.keys(patch).length > 0;

  const update = useCallback((p: Partial<ProfileForm>) => {
    setSaved(false);
    setError(null);
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }, []);

  const canCalc =
    !!form?.sex &&
    Number(form?.weight_kg) > 0 &&
    Number(form?.height_cm) > 0 &&
    Number(form?.age) > 0;
  const calculated = useMemo(() => {
    if (!form || !canCalc) return null;
    return calculateMacros(Number(form.weight_kg), Number(form.height_cm), Number(form.age), form.sex, form.activity_level);
  }, [canCalc, form]);

  const handleSave = useCallback(async () => {
    if (!patch || Object.keys(patch).length === 0) return;
    setError(null);
    setSaved(false);
    try {
      await saveProfileMutation.mutateAsync(patch);
      setSaved(true);
      void refetch();
    } catch (e) {
      console.error(e);
      setError("Could not save profile. Your previous saved values are still intact.");
    }
  }, [patch, refetch, saveProfileMutation]);

  const handleSaveAI = useCallback(async () => {
    setAiSaving(true);
    try {
      await saveAIProfile({
        preferred_tone: aiTone,
        about_me: aiAboutMe.trim() || null,
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
  }, [aiAboutMe, aiFocusAreas, aiGoalsSummary, aiLifestyleNotes, aiTone]);

  if (isAuthLoading) {
    return (
      <ProfileStateCard
        title="Checking your account"
        description="We're confirming your session before loading profile settings."
        status="loading"
      />
    );
  }

  if (isProfileLoading) {
    return (
      <ProfileStateCard
        title="Loading profile settings"
        description="Your saved profile is still loading, so we'll wait instead of showing an empty state too early."
        status="loading"
      />
    );
  }

  if (loadError) {
    return (
      <ProfileStateCard
        title="We couldn't load profile settings"
        description="This looks like a temporary fetch problem. Retry to keep working from your saved profile once it's available."
        status="error"
        actionLabel="Retry"
        onAction={() => void refetch()}
        busy={isFetching}
      />
    );
  }

  if (isMissingProfile || !profile || !form) {
    return (
      <ProfileStateCard
        title="No profile record found"
        description="Your account is available, but we couldn't find a saved profile yet. Retry first, then rerun onboarding if needed."
        status="empty"
        actionLabel="Retry lookup"
        onAction={() => void refetch()}
        busy={isFetching}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Profile settings</h1>
          <p className="text-sm text-muted-foreground">
            Update the same saved profile used by onboarding, dashboard defaults, and goal setup.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {saved ? (
            <div className="flex items-center gap-1 text-xs text-emerald-600"><Check className="h-4 w-4" /> Saved</div>
          ) : null}
          <Button onClick={() => void handleSave()} disabled={!isDirty || saveProfileMutation.isPending} className="min-w-28 gap-2">
            {saveProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saveProfileMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-dashed bg-muted/20 py-4 shadow-none">
        <CardContent className="space-y-2 pt-0 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-foreground">Save status</p>
            <span className="text-xs text-muted-foreground">
              {saveProfileMutation.isPending
                ? "Saving updates to your profile…"
                : isDirty
                  ? "You have unsaved changes."
                  : "All changes are synced with your saved profile."}
            </span>
          </div>
          <p className="text-muted-foreground">
            Changes here update the same normalized profile data used during onboarding, so dashboard defaults stay aligned right away.
          </p>
          {error ? <p className="font-medium text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <AIUsageDetailsCard />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">👤 Profile</CardTitle>
          <CardDescription>Basic identity and body metrics used for personalization and nutrition targets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <IdentitySection
            displayName={form.display_name}
            sex={form.sex}
            onDisplayNameChange={(value) => update({ display_name: value })}
            onSexChange={(value) => update({ sex: value })}
          />
          <BodyMetricsSection
            age={form.age}
            weightKg={form.weight_kg}
            heightCm={form.height_cm}
            activityLevel={form.activity_level}
            onAgeChange={(value) => update({ age: value })}
            onWeightChange={(value) => update({ weight_kg: value })}
            onHeightChange={(value) => update({ height_cm: value })}
            onActivityLevelChange={(value) => update({ activity_level: value })}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">🧩 Modules</CardTitle>
          <CardDescription>Keep dashboard modules aligned with the workspace you actually want to use.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModulesSection value={form.enabled_modules} onChange={(next) => update({ enabled_modules: next })} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">🥗 Macros</CardTitle>
          <CardDescription>Adjust your saved nutrition targets or recalculate them from your current metrics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <MacrosSection
            macroMaintain={form.macro_maintain}
            macroCut={form.macro_cut}
            calculated={calculated}
            onMacroMaintainChange={(targets) => update({ macro_maintain: targets })}
            onMacroCutChange={(targets) => update({ macro_cut: targets })}
            onRecalculate={() => {
              if (!calculated) return;
              update({ macro_maintain: calculated.maintain, macro_cut: calculated.cut });
            }}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">📅 Schedule</CardTitle>
          <CardDescription>Use the same card-style defaults from onboarding so weekly planning stays predictable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {WEEKDAY_ORDER.map((day) => (
            <div key={day} className="grid grid-cols-[minmax(0,1fr),auto] items-center gap-3 rounded-xl border bg-background px-3 py-3">
              <div>
                <p className="text-sm font-medium">{DAY_LABELS[day] ?? day}</p>
                <p className="text-xs text-muted-foreground">
                  {SCHEDULE_OPTIONS.find((option) => option.value === form.weekly_schedule[day])?.description}
                </p>
              </div>
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={form.weekly_schedule[day]}
                onChange={(e) =>
                  update({
                    weekly_schedule: {
                      ...form.weekly_schedule,
                      [day]: e.target.value as WeeklyScheduleValue,
                    },
                  })
                }
              >
                {SCHEDULE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">📖 Reading</CardTitle>
          <CardDescription>Set a clear daily pages target that matches your reading routine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            className="w-40"
            value={form.daily_reading_goal}
            onChange={(e) => {
              const result = validateClampedNumberInput(e.target.value, {
                min: 1,
                max: 200,
              });
              setReadingGoalError(result.error);
              if (result.nextValue !== null) update({ daily_reading_goal: result.nextValue });
            }}
            aria-invalid={!!readingGoalError}
          />
          {readingGoalError ? (
            <p className="text-xs text-destructive">{readingGoalError}</p>
          ) : null}
        </CardContent>
      </Card>

      <Link to="/app/achievements">
        <Card className="mb-6 cursor-pointer rounded-2xl border-amber-500/20 bg-amber-500/5 transition-all hover:bg-amber-500/10">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-xl">🏆</div>
            <div className="flex-1">Achievements</div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <AISettingsSection
        aiSaving={aiSaving}
        aiAboutMe={aiAboutMe}
        aiTone={aiTone}
        aiGoalsSummary={aiGoalsSummary}
        aiLifestyleNotes={aiLifestyleNotes}
        aiFocusAreas={aiFocusAreas}
        onAiAboutMeChange={setAiAboutMe}
        onAiToneChange={setAiTone}
        onAiGoalsSummaryChange={setAiGoalsSummary}
        onAiLifestyleNotesChange={setAiLifestyleNotes}
        onAiFocusAreasChange={setAiFocusAreas}
        onSave={() => void handleSaveAI()}
      />
    </div>
  );
}
