import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  Dumbbell,
  Flame,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { m } from "framer-motion";
import { fadeUp, landingEase, popIn, staggerContainer } from "../motion";
import { TOKENS } from "../theme/tokens";
import type { ThemeMode } from "../types";

type HeroProductPreviewProps = {
  theme: ThemeMode;
  compact?: boolean;
};

const modules = [
  {
    label: "Goals",
    pct: 72,
    icon: Target,
    tone: "from-emerald-300 to-cyan-200",
    stat: "2 active arcs",
  },
  {
    label: "Fitness",
    pct: 81,
    icon: Dumbbell,
    tone: "from-blue-300 to-cyan-200",
    stat: "3 sessions set",
  },
  {
    label: "Reading",
    pct: 64,
    icon: BookOpen,
    tone: "from-amber-300 to-emerald-200",
    stat: "21 pages today",
  },
  {
    label: "Rhythm",
    pct: 76,
    icon: Flame,
    tone: "from-violet-300 to-emerald-200",
    stat: "6 day streak",
  },
];

const cues = [
  "Calendar has a clean 60 minute window",
  "Reading momentum is strongest at night",
  "Training goal still has a live next step",
];

function MiniProgress({
  pct,
  tone,
}: {
  pct: number;
  tone: string;
}) {
  return (
    <div className="relative h-1.5 overflow-hidden rounded-full bg-white/8 shadow-inner">
      <m.div
        className={`h-full rounded-full bg-gradient-to-r ${tone} shadow-[0_0_18px_rgba(74,222,128,0.18)]`}
        initial={{ opacity: 0.7, scaleX: 0.35 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.75, ease: landingEase }}
        style={{ width: `${pct}%`, transformOrigin: "0% 50%" }}
      />
      <div className="absolute inset-0 animate-[ai-sheen_6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-30" />
    </div>
  );
}

function ModuleSignal({
  label,
  pct,
  icon: Icon,
  tone,
  stat,
  index,
}: {
  label: string;
  pct: number;
  icon: typeof Target;
  tone: string;
  stat: string;
  index: number;
}) {
  return (
    <m.div
      className={[
        "ai-layer-soft group min-w-0 rounded-2xl p-3 transition-all duration-500 hover:-translate-y-0.5 hover:bg-background/35",
        index === 0 ? "col-span-2 row-span-2 sm:col-span-2" : "",
        index === 2 ? "sm:-translate-y-2" : "",
      ].join(" ")}
      variants={fadeUp(12, index * 0.04)}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-200" />
          <span className="truncate text-xs font-semibold">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums text-emerald-200">
          {pct}%
        </span>
      </div>
      <MiniProgress pct={pct} tone={tone} />
      <p className="mt-2 truncate text-[10px] text-muted-foreground">{stat}</p>
    </m.div>
  );
}

function CoachSurface({ compact = false }: { compact?: boolean }) {
  return (
    <m.div
      className="relative overflow-visible"
      variants={popIn(0.02)}
    >
      <div className="pointer-events-none absolute -inset-x-4 -inset-y-6 bg-gradient-to-br from-violet-400/10 via-cyan-300/10 to-emerald-300/12 opacity-80 blur-2xl" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-background/48 px-4 py-4 shadow-[0_20px_58px_rgba(2,6,23,0.18)] backdrop-blur-md sm:rounded-[2rem] sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-24 h-48 w-48 rounded-full bg-cyan-300/[0.08] blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative mt-0.5">
                <Brain className="h-4 w-4 text-violet-300" />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Begyn
                </span>
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground/60">
                  Evening flow - adaptive guidance
                </div>
              </div>
            </div>
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground/45" />
          </div>

          <div className={compact ? "mt-4" : "mt-5"}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="flex min-w-0 items-start gap-3.5">
                <Sparkles className="mt-1 h-5 w-5 shrink-0 animate-pulse text-violet-300" />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/65">
                    Next best move
                  </div>
                  <p className="max-w-3xl text-[1.15rem] font-semibold leading-[1.12] tracking-tight sm:text-[1.35rem]">
                    Protect the 60 minute training window before the day gets loud.
                  </p>
                  <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
                    This keeps your strength goal alive and leaves tonight open for reading momentum.
                  </p>
                  {!compact && (
                    <p className="mt-3 max-w-2xl border-l border-white/10 pl-3 text-xs leading-5 text-muted-foreground/68">
                      You usually follow through when the action is placed before dinner.
                    </p>
                  )}
                </div>
              </div>

              {!compact && (
                <div className="flex items-center gap-2 sm:min-w-[10rem] sm:justify-end">
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground/55"
                    aria-label="Preview complete action"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <div className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground/92 px-4 text-xs font-semibold text-background shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                    Open path <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}

function FocusCard() {
  return (
    <m.div
      className="ai-layer-soft rounded-[1.45rem] p-4"
      variants={popIn(0.08)}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-cyan-200" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Now focus
          </span>
        </div>
        <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
          clear
        </span>
      </div>
      <p className="text-sm font-semibold leading-tight">Lift session</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        18:00 - 19:00. One contained action, no replanning.
      </p>
    </m.div>
  );
}

function MomentumCard() {
  return (
    <m.div
      className="ai-atmosphere ai-reactive-edge overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-emerald-400/12 via-cyan-300/8 to-violet-400/10 p-4"
      variants={popIn(0.12)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Momentum
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight">Steady rhythm</p>
        </div>
        <div className="relative h-14 w-14">
          <div className="absolute inset-1 rounded-full bg-emerald-300/10 blur-sm" />
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="none" strokeWidth="3" className="stroke-white/10" />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              strokeWidth="3"
              strokeDasharray="113"
              strokeDashoffset="27"
              strokeLinecap="round"
              stroke="url(#hero-momentum-ring)"
            />
            <defs>
              <linearGradient id="hero-momentum-ring" x1="4" y1="4" x2="36" y2="36">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="58%" stopColor="#67e8f9" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            76%
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Goals, training, and reading are pointing in the same direction today.
      </p>
    </m.div>
  );
}

function CueRail() {
  return (
    <m.div
      className="grid gap-2"
      variants={fadeUp(12, 0.16)}
    >
      {cues.map((cue, index) => (
        <div
          key={cue}
          className="ai-layer-soft flex items-center gap-2 rounded-full px-3 py-2 text-[11px] text-muted-foreground"
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.65)]",
              index === 1 ? "bg-cyan-300" : "bg-emerald-300",
            ].join(" ")}
          />
          <span className="truncate">{cue}</span>
        </div>
      ))}
    </m.div>
  );
}

export function HeroProductPreview({
  theme,
  compact = false,
}: HeroProductPreviewProps) {
  const t = TOKENS[theme];

  if (compact) {
    return (
      <div
        className="relative overflow-hidden rounded-[30px] p-[1px]"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(145deg, rgba(74,222,128,0.22), rgba(96,165,250,0.10), rgba(255,255,255,0.06))"
              : t.borderStrong,
          boxShadow:
            theme === "dark"
              ? "0 22px 70px rgba(0,0,0,0.34)"
              : "0 14px 36px rgba(15,23,42,0.08)",
        }}
      >
        <div
          className="relative rounded-[29px] p-3.5 sm:p-4"
          style={{
            background:
              theme === "dark"
                ? "linear-gradient(150deg, rgba(15,23,42,0.84), rgba(6,11,20,0.90))"
                : t.surface,
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-300/8 via-transparent to-cyan-300/8" />
          <div className="relative mb-3 flex h-6 items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
            <div className="flex-1 text-center font-mono text-[10px]" style={{ color: t.faint }}>
              Begyn live
            </div>
          </div>

          <m.div
            className="relative space-y-3"
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1, 0.12)}
          >
            <CoachSurface compact />
            <div className="grid grid-cols-2 gap-2">
              {modules.slice(0, 4).map((item, index) => (
                <ModuleSignal key={item.label} index={index} {...item} />
              ))}
            </div>
          </m.div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-full overflow-hidden rounded-[36px] p-[1px] lg:[transform:perspective(1200px)_rotateY(-4deg)_rotateX(2deg)]"
      style={{
        background:
          theme === "dark"
            ? "linear-gradient(135deg, rgba(74,222,128,0.24), rgba(96,165,250,0.13), rgba(255,255,255,0.05))"
            : t.borderStrong,
        boxShadow:
          theme === "dark"
            ? "0 44px 140px rgba(0,0,0,0.58), 0 0 90px rgba(74,222,128,0.08)"
            : t.shadow,
        minHeight: 640,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(74,222,128,0.16),transparent_30%),radial-gradient(circle_at_92%_12%,rgba(96,165,250,0.10),transparent_32%)]" />
      <div
        className="relative flex h-full flex-col rounded-[35px] p-4 sm:p-5"
        style={{
          background:
            theme === "dark"
              ? "linear-gradient(155deg, rgba(15,23,42,0.76), rgba(6,11,20,0.92) 58%, rgba(6,11,20,0.78))"
              : t.surface,
          backdropFilter: "blur(18px)",
        }}
      >
        <div className="mb-4 flex h-6 items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/80" />
          <div className="flex-1 text-center font-mono text-[10px]" style={{ color: t.faint }}>
            Begyn dashboard - today
          </div>
        </div>

        <m.div
          className="grid flex-1 gap-3"
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.1, 0.12)}
        >
          <section className="ai-depth-stage ai-layer relative min-w-0 overflow-hidden rounded-[2.15rem] p-3">
            <div className="grid min-w-0 gap-3 lg:grid-cols-12 lg:items-start">
              <div className="relative z-20 lg:col-span-8">
                <CoachSurface />
                <div className="mt-3 hidden lg:block">
                  <CueRail />
                </div>
              </div>
              <div className="relative z-10 space-y-3 lg:col-span-4 lg:translate-y-5">
                <FocusCard />
                <MomentumCard />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                System signals
              </h3>
              <span className="text-[10px] text-muted-foreground/70">available when needed</span>
            </div>
            <m.div
              className="grid auto-rows-[minmax(4.5rem,auto)] grid-cols-4 gap-2.5 opacity-90"
              variants={staggerContainer(0.06)}
            >
              {modules.map((item, index) => (
                <ModuleSignal key={item.label} index={index} {...item} />
              ))}
            </m.div>
          </section>
        </m.div>
      </div>
    </div>
  );
}
