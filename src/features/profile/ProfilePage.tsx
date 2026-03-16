import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  calculateMacros,
  loadProfile,
  saveProfile,
  type UserProfile,
  type ScheduleView,
} from "@/features/onboarding/profileStorage";
import { loadAIProfile, saveAIProfile, type PreferredTone } from "@/features/ai/aiUserProfile";
import { toast } from "sonner";
import { AIUsageDetailsCard } from "@/features/subscription/AIUsageDetailsCard";
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

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);

  const [aiSaving, setAiSaving] = useState(false);
  const [aiAboutMe, setAiAboutMe] = useState("");
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
      default_schedule_view: profile.default_schedule_view,
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
    setForm((prev) => (prev ? { ...prev, ...p } : prev));
  }, []);

  const canCalc = !!form?.weight_kg && !!form?.height_cm && !!form?.age && !!form?.sex;
  const calculated = useMemo(() => {
    if (!form || !canCalc) return null;
    return calculateMacros(Number(form.weight_kg), Number(form.height_cm), Number(form.age), form.sex, form.activity_level);
  }, [canCalc, form]);

  const handleSave = useCallback(async () => {
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
  }, [patch]);

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

  if (loading) return <div className="mx-auto max-w-3xl p-6 text-sm text-muted-foreground">Loading profile…</div>;
  if (!profile || !form) return <div className="mx-auto max-w-3xl p-6">No profile found.</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 lg:p-8">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold">Profile settings</h1>
        <div className="flex items-center gap-2">
          {saved ? <div className="flex items-center gap-1 text-xs text-emerald-600"><Check className="h-4 w-4" /> Saved</div> : null}
          <Button onClick={handleSave} disabled={!isDirty || saving} className="min-w-28">{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}
      <AIUsageDetailsCard />

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">👤 Profile</CardTitle></CardHeader>
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

      <Card className="rounded-2xl"><CardHeader><CardTitle className="text-base">🧩 Modules</CardTitle></CardHeader><CardContent><ModulesSection value={form.enabled_modules} onChange={(next) => update({ enabled_modules: next })} /></CardContent></Card>

      <Card className="rounded-2xl">
        <CardContent className="space-y-5 pt-6">
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
        <CardHeader><CardTitle className="text-base">📅 Schedule</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {([
            { value: "wfh", label: "Work from home", sub: "Mon / Tue — no commute", icon: "🏠" },
            { value: "office", label: "Office day", sub: "Wed / Thu / Fri — commute", icon: "🏢" },
            { value: "weekend", label: "Weekend", sub: "Sat / Sun — flexible", icon: "☀️" },
          ] as { value: ScheduleView; label: string; sub: string; icon: string }[]).map((opt) => (
            <button key={opt.value} type="button" onClick={() => update({ default_schedule_view: opt.value })} className={cn("w-full rounded-xl border px-4 py-4 text-left transition-all", form.default_schedule_view === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/40")}>{opt.label}</button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base">📖 Reading</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input type="number" min="1" max="200" className="w-40" value={form.daily_reading_goal} onChange={(e) => update({ daily_reading_goal: e.target.value })} />
        </CardContent>
      </Card>

      <Link to="/app/achievements">
        <Card className="mb-6 cursor-pointer rounded-2xl border-amber-500/20 bg-amber-500/5 transition-all hover:bg-amber-500/10">
          <CardContent className="flex items-center gap-4 py-5">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div className="flex-1">🏆 Achievements</div>
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
