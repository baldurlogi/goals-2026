import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateMacros,
  WEEKDAY_ORDER,
  type WeekdayKey,
  type WeeklyScheduleValue,
} from "@/features/onboarding/profileStorage";
import { getPhaseTargetsForEditor } from "@/features/nutrition/nutritionData";
import { useProfileState, useSaveProfileMutation } from "@/features/onboarding/useProfileQuery";
import { loadAIProfile, saveAIProfile, type PreferredTone } from "@/features/ai/aiUserProfile";
import { toast } from "sonner";
import { AIUsageDetailsCard } from "@/features/subscription/AIUsageDetailsCard";
import { ProfileStateCard } from "@/features/onboarding/components/ProfileStateCard";
import { validateClampedNumberInput } from "@/lib/numericInput";
import { cn } from "@/lib/utils";
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

type ProfileSectionKey =
  | "profile"
  | "modules"
  | "macros"
  | "schedule"
  | "reading";

type SettingsNavSection = ProfileSectionKey | "ai";

const PROFILE_SECTION_FIELDS: Record<
  ProfileSectionKey,
  Array<keyof EditableProfileFields>
> = {
  profile: [
    "display_name",
    "sex",
    "age",
    "weight_kg",
    "height_cm",
    "activity_level",
    "measurement_system",
    "date_format",
    "time_format",
  ],
  modules: ["enabled_modules"],
  macros: [
    "macro_maintain",
    "macro_cut",
    "macro_recomp",
    "macro_muscle_gain",
    "macro_performance",
    "nutrition_goal_focuses",
  ],
  schedule: ["weekly_schedule"],
  reading: ["daily_reading_goal"],
};

const SETTINGS_NAV_ITEMS: Array<{
  id: SettingsNavSection;
  label: string;
}> = [
  { id: "profile", label: "Profile" },
  { id: "modules", label: "Modules" },
  { id: "macros", label: "Macros" },
  { id: "schedule", label: "Schedule" },
  { id: "reading", label: "Reading" },
  { id: "ai", label: "AI Coach" },
];

function pickSectionPatch(
  fullPatch: Partial<EditableProfileFields> | null,
  section: ProfileSectionKey,
) {
  if (!fullPatch) return null;

  const sectionPatch = {} as Partial<EditableProfileFields>;

  for (const key of PROFILE_SECTION_FIELDS[section]) {
    if (key in fullPatch) {
      Object.assign(sectionPatch, {
        [key]: fullPatch[key],
      });
    }
  }

  return Object.keys(sectionPatch).length > 0 ? sectionPatch : null;
}

export function ProfilePage() {
  const { profile, isAuthLoading, isProfileLoading, isMissingProfile, error: loadError, isFetching, refetch } = useProfileState();
  const saveProfileMutation = useSaveProfileMutation();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeSaveSection, setActiveSaveSection] = useState<ProfileSectionKey | null>(null);
  const [lastSavedSection, setLastSavedSection] = useState<ProfileSectionKey | null>(null);
  const [lastErroredSection, setLastErroredSection] = useState<ProfileSectionKey | null>(null);
  const [readingGoalError, setReadingGoalError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm | null>(null);

  const [aiSaving, setAiSaving] = useState(false);
  const [aiAboutMe, setAiAboutMe] = useState("");
  const [aiTone, setAiTone] = useState<PreferredTone>("direct");
  const [aiGoalsSummary, setAiGoalsSummary] = useState("");
  const [aiLifestyleNotes, setAiLifestyleNotes] = useState("");
  const [aiFocusAreas, setAiFocusAreas] = useState<string[]>([]);
  const hydratedProfileIdRef = useRef<string | null>(null);
  const sectionRefs = useRef<Record<SettingsNavSection, HTMLDivElement | null>>({
    profile: null,
    modules: null,
    macros: null,
    schedule: null,
    reading: null,
    ai: null,
  });
  const [activeNavSection, setActiveNavSection] = useState<SettingsNavSection>("profile");

  useEffect(() => {
    setForm((prev) => {
      if (!profile) {
        hydratedProfileIdRef.current = null;
        return null;
      }

      if (!prev || hydratedProfileIdRef.current !== profile.id) {
        hydratedProfileIdRef.current = profile.id;
        return profileToForm(profile);
      }

      return prev;
    });
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        const nextVisible = visibleEntries[0];
        if (!nextVisible) return;

        const sectionId = nextVisible.target.getAttribute(
          "data-settings-section",
        ) as SettingsNavSection | null;

        if (sectionId) {
          setActiveNavSection(sectionId);
        }
      },
      {
        rootMargin: "-120px 0px -55% 0px",
        threshold: [0.2, 0.4, 0.6],
      },
    );

    const elements = Object.values(sectionRefs.current).filter(
      (element): element is HTMLDivElement => Boolean(element),
    );

    elements.forEach((element) => observer.observe(element));

    return () => {
      elements.forEach((element) => observer.unobserve(element));
      observer.disconnect();
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
      macro_recomp: profile.macro_recomp,
      macro_muscle_gain: profile.macro_muscle_gain,
      macro_performance: profile.macro_performance,
      nutrition_goal_focuses: profile.nutrition_goal_focuses,
      weekly_schedule: profile.weekly_schedule,
      daily_reading_goal: profile.daily_reading_goal,
      enabled_modules: normalizeEnabledModules(profile.enabled_modules),
      measurement_system: profile.measurement_system,
      date_format: profile.date_format,
      time_format: profile.time_format,
    };
    return base;
  }, [profile]);

  const nextFull = useMemo(() => (form ? formToFullPatch(form) : null), [form]);
  const patch = useMemo(() => (originalFull && nextFull ? diffPatch(originalFull, nextFull) : null), [nextFull, originalFull]);
  const isDirty = !!patch && Object.keys(patch).length > 0;
  const profileSectionPatch = useMemo(() => pickSectionPatch(patch, "profile"), [patch]);
  const modulesSectionPatch = useMemo(() => pickSectionPatch(patch, "modules"), [patch]);
  const macrosSectionPatch = useMemo(() => pickSectionPatch(patch, "macros"), [patch]);
  const scheduleSectionPatch = useMemo(() => pickSectionPatch(patch, "schedule"), [patch]);
  const readingSectionPatch = useMemo(() => pickSectionPatch(patch, "reading"), [patch]);

  const update = useCallback((p: Partial<ProfileForm>) => {
    setSaved(false);
    setError(null);
    setLastSavedSection(null);
    setLastErroredSection(null);
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

  const handleSaveSection = useCallback(async (section: ProfileSectionKey) => {
    const sectionPatch = pickSectionPatch(patch, section);
    if (!sectionPatch || Object.keys(sectionPatch).length === 0) return;

    setError(null);
    setSaved(false);
    setLastSavedSection(null);
    setLastErroredSection(null);
    setActiveSaveSection(section);

    try {
      await saveProfileMutation.mutateAsync(sectionPatch);
      setSaved(true);
      setLastSavedSection(section);
    } catch (e) {
      console.error(e);
      setError("Could not save profile. Your previous saved values are still intact.");
      setLastErroredSection(section);
    } finally {
      setActiveSaveSection(null);
    }
  }, [patch, saveProfileMutation]);

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

  const scrollToSection = useCallback((section: SettingsNavSection) => {
    setActiveNavSection(section);
    sectionRefs.current[section]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

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
          {saved && !isDirty ? (
            <div className="flex items-center gap-1 text-xs text-emerald-600"><Check className="h-4 w-4" /> Saved</div>
          ) : null}
        </div>
      </div>

      <div className="sticky top-14 z-20 -mx-4 border-y bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:mx-0 lg:rounded-xl lg:border">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SETTINGS_NAV_ITEMS.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={activeNavSection === item.id ? "default" : "outline"}
              size="sm"
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "shrink-0 rounded-full",
                activeNavSection !== item.id && "bg-background",
              )}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <AIUsageDetailsCard />

      <div
        ref={(element) => {
          sectionRefs.current.profile = element;
        }}
        data-settings-section="profile"
        className="scroll-mt-36"
      >
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">👤 Profile</CardTitle>
          <CardDescription>Basic identity and body metrics used for personalization and nutrition targets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <IdentitySection
            displayName={form.display_name}
            sex={form.sex}
            measurementSystem={form.measurement_system}
            dateFormat={form.date_format}
            timeFormat={form.time_format}
            onDisplayNameChange={(value) => update({ display_name: value })}
            onSexChange={(value) => update({ sex: value })}
            onMeasurementSystemChange={(value) =>
              update({ measurement_system: value })
            }
            onDateFormatChange={(value) => update({ date_format: value })}
            onTimeFormatChange={(value) => update({ time_format: value })}
          />
          <BodyMetricsSection
            age={form.age}
            weightKg={form.weight_kg}
            heightCm={form.height_cm}
            measurementSystem={form.measurement_system}
            activityLevel={form.activity_level}
            onAgeChange={(value) => update({ age: value })}
            onWeightChange={(value) => update({ weight_kg: value })}
            onHeightChange={(value) => update({ height_cm: value })}
            onActivityLevelChange={(value) => update({ activity_level: value })}
          />
        </CardContent>
        <CardFooter className="flex flex-col items-start justify-between gap-3 border-t sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            {lastErroredSection === "profile" && error
              ? error
              : profileSectionPatch
                ? "Save identity, body metrics, and preferences together."
                : lastSavedSection === "profile"
                  ? "Profile details are saved."
                  : "No profile changes to save right now."}
          </p>
          <Button
            onClick={() => void handleSaveSection("profile")}
            disabled={!profileSectionPatch || saveProfileMutation.isPending}
            className="w-full gap-2 sm:w-auto"
          >
            {activeSaveSection === "profile" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {activeSaveSection === "profile"
              ? "Saving…"
              : lastSavedSection === "profile" && !profileSectionPatch
                ? "Saved"
                : "Save profile"}
          </Button>
        </CardFooter>
      </Card>
      </div>

      <div
        ref={(element) => {
          sectionRefs.current.modules = element;
        }}
        data-settings-section="modules"
        className="scroll-mt-36"
      >
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">🧩 Modules</CardTitle>
          <CardDescription>Keep dashboard modules aligned with the workspace you actually want to use.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModulesSection value={form.enabled_modules} onChange={(next) => update({ enabled_modules: next })} />
        </CardContent>
        <CardFooter className="flex flex-col items-start justify-between gap-3 border-t sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            {lastErroredSection === "modules" && error
              ? error
              : modulesSectionPatch
                ? "Save your enabled modules when you're happy with this setup."
                : lastSavedSection === "modules"
                  ? "Modules are saved."
                  : "No module changes to save right now."}
          </p>
          <Button
            onClick={() => void handleSaveSection("modules")}
            disabled={!modulesSectionPatch || saveProfileMutation.isPending}
            className="w-full gap-2 sm:w-auto"
          >
            {activeSaveSection === "modules" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {activeSaveSection === "modules"
              ? "Saving…"
              : lastSavedSection === "modules" && !modulesSectionPatch
                ? "Saved"
                : "Save modules"}
          </Button>
        </CardFooter>
      </Card>
      </div>

      <div
        ref={(element) => {
          sectionRefs.current.macros = element;
        }}
        data-settings-section="macros"
        className="scroll-mt-36"
      >
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">🥗 Macros</CardTitle>
          <CardDescription>Adjust your saved nutrition targets or recalculate them from your current metrics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <MacrosSection
            macroMaintain={form.macro_maintain}
            macroCut={form.macro_cut}
            macroRecomp={form.macro_recomp}
            macroMuscleGain={form.macro_muscle_gain}
            macroPerformance={form.macro_performance}
            nutritionGoalFocuses={form.nutrition_goal_focuses}
            calculated={calculated}
            onMacroMaintainChange={(targets) => update({ macro_maintain: targets })}
            onMacroCutChange={(targets) => update({ macro_cut: targets })}
            onMacroRecompChange={(targets) => update({ macro_recomp: targets })}
            onMacroMuscleGainChange={(targets) =>
              update({ macro_muscle_gain: targets })
            }
            onMacroPerformanceChange={(targets) =>
              update({ macro_performance: targets })
            }
            onNutritionGoalFocusesChange={(focuses) =>
              update({ nutrition_goal_focuses: focuses })
            }
            onRecalculate={() => {
              if (!calculated) return;
              const maintain = calculated.maintain;
              const fatLoss = calculated.cut;
              update({
                macro_maintain: maintain,
                macro_cut: fatLoss,
                macro_recomp: getPhaseTargetsForEditor("recomp", {
                  display_name: null,
                  macro_maintain: maintain,
                  macro_cut: fatLoss,
                  macro_recomp: null,
                  macro_muscle_gain: null,
                  macro_performance: null,
                }),
                macro_muscle_gain: getPhaseTargetsForEditor("muscle_gain", {
                  display_name: null,
                  macro_maintain: maintain,
                  macro_cut: fatLoss,
                  macro_recomp: null,
                  macro_muscle_gain: null,
                  macro_performance: null,
                }),
                macro_performance: getPhaseTargetsForEditor("performance", {
                  display_name: null,
                  macro_maintain: maintain,
                  macro_cut: fatLoss,
                  macro_recomp: null,
                  macro_muscle_gain: null,
                  macro_performance: null,
                }),
              });
            }}
          />
        </CardContent>
        <CardFooter className="flex flex-col items-start justify-between gap-3 border-t sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            {lastErroredSection === "macros" && error
              ? error
              : macrosSectionPatch
                ? "Save your nutrition targets after recalculating or editing them."
                : lastSavedSection === "macros"
                  ? "Macros are saved."
                  : "No macro changes to save right now."}
          </p>
          <Button
            onClick={() => void handleSaveSection("macros")}
            disabled={!macrosSectionPatch || saveProfileMutation.isPending}
            className="w-full gap-2 sm:w-auto"
          >
            {activeSaveSection === "macros" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {activeSaveSection === "macros"
              ? "Saving…"
              : lastSavedSection === "macros" && !macrosSectionPatch
                ? "Saved"
                : "Save macros"}
          </Button>
        </CardFooter>
      </Card>
      </div>

      <div
        ref={(element) => {
          sectionRefs.current.schedule = element;
        }}
        data-settings-section="schedule"
        className="scroll-mt-36"
      >
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
        <CardFooter className="flex flex-col items-start justify-between gap-3 border-t sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            {lastErroredSection === "schedule" && error
              ? error
              : scheduleSectionPatch
                ? "Save your weekly defaults so daily planning stays predictable."
                : lastSavedSection === "schedule"
                  ? "Schedule defaults are saved."
                  : "No schedule changes to save right now."}
          </p>
          <Button
            onClick={() => void handleSaveSection("schedule")}
            disabled={!scheduleSectionPatch || saveProfileMutation.isPending}
            className="w-full gap-2 sm:w-auto"
          >
            {activeSaveSection === "schedule" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {activeSaveSection === "schedule"
              ? "Saving…"
              : lastSavedSection === "schedule" && !scheduleSectionPatch
                ? "Saved"
                : "Save schedule"}
          </Button>
        </CardFooter>
      </Card>
      </div>

      <div
        ref={(element) => {
          sectionRefs.current.reading = element;
        }}
        data-settings-section="reading"
        className="scroll-mt-36"
      >
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
        <CardFooter className="flex flex-col items-start justify-between gap-3 border-t sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            {lastErroredSection === "reading" && error
              ? error
              : readingGoalError
                ? readingGoalError
                : readingSectionPatch
                  ? "Save your daily reading target when it feels right."
                  : lastSavedSection === "reading"
                    ? "Reading goal is saved."
                    : "No reading changes to save right now."}
          </p>
          <Button
            onClick={() => void handleSaveSection("reading")}
            disabled={!readingSectionPatch || !!readingGoalError || saveProfileMutation.isPending}
            className="w-full gap-2 sm:w-auto"
          >
            {activeSaveSection === "reading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {activeSaveSection === "reading"
              ? "Saving…"
              : lastSavedSection === "reading" && !readingSectionPatch
                ? "Saved"
                : "Save reading"}
          </Button>
        </CardFooter>
      </Card>
      </div>

      <Link to="/app/achievements">
        <Card className="mb-6 cursor-pointer rounded-2xl border-amber-500/20 bg-amber-500/5 transition-all hover:bg-amber-500/10">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-xl">🏆</div>
            <div className="flex-1">Achievements</div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <div
        ref={(element) => {
          sectionRefs.current.ai = element;
        }}
        data-settings-section="ai"
        className="scroll-mt-36"
      >
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
    </div>
  );
}
