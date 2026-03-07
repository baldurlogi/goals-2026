import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type ThemeMode = "dark" | "light";
type BillingMode = "monthly" | "yearly";

/* ── tiny hook: intersection observer for scroll reveals ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

const TOKENS = {
  dark: {
    bg: "#060b14",
    bgSoft: "#0b1220",
    surface: "#0f172a",
    surface2: "#111827",
    surface3: "rgba(255,255,255,0.03)",
    text: "#f8fafc",
    textSoft: "#cbd5e1",
    muted: "#94a3b8",
    faint: "#64748b",
    faint2: "#334155",
    border: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.14)",
    primary: "#4ade80",
    primarySoft: "rgba(74,222,128,0.12)",
    primaryBorder: "rgba(74,222,128,0.24)",
    blue: "#60a5fa",
    amber: "#f59e0b",
    purple: "#c084fc",
    rose: "#fb7185",
    shadow: "0 40px 120px rgba(0,0,0,0.55)",
    heroGlow:
      "radial-gradient(ellipse at center, rgba(74,222,128,0.10) 0%, rgba(96,165,250,0.06) 35%, transparent 72%)",
  },
  light: {
    bg: "#f8fafc",
    bgSoft: "#eef2f7",
    surface: "#ffffff",
    surface2: "#f8fafc",
    surface3: "rgba(15,23,42,0.03)",
    text: "#0f172a",
    textSoft: "#1e293b",
    muted: "#475569",
    faint: "#64748b",
    faint2: "#94a3b8",
    border: "rgba(15,23,42,0.08)",
    borderStrong: "rgba(15,23,42,0.14)",
    primary: "#16a34a",
    primarySoft: "rgba(22,163,74,0.10)",
    primaryBorder: "rgba(22,163,74,0.22)",
    blue: "#2563eb",
    amber: "#d97706",
    purple: "#7c3aed",
    rose: "#e11d48",
    shadow: "0 28px 80px rgba(15,23,42,0.10)",
    heroGlow:
      "radial-gradient(ellipse at center, rgba(22,163,74,0.08) 0%, rgba(37,99,235,0.05) 35%, transparent 72%)",
  },
};

type Tokens = typeof TOKENS.dark;

const FEATURE_CARDS = [
  {
    icon: "✦",
    title: "AI turns big goals into clear plans",
    body: "Type something like 'run a marathon by October' or 'launch my SaaS' and get a structured plan with realistic steps, dates, and priorities.",
    accent: "primary" as const,
  },
  {
    icon: "→",
    title: "Always know what to do next",
    body: "Instead of feeling stuck or overwhelmed, the app helps you focus on the next meaningful action so progress feels possible every day.",
    accent: "blue" as const,
  },
  {
    icon: "▣",
    title: "See how your life is actually moving",
    body: "Track goals, habits, fitness, reading, schedule, and finances in one place — and see how small actions connect to long-term progress.",
    accent: "amber" as const,
  },
  {
    icon: "◉",
    title: "Built for ambitious people with busy brains",
    body: "Made for people who care about growth but struggle with keeping up, remembering everything, or knowing where to start.",
    accent: "purple" as const,
  },
];

const PERSONA_PILLS = [
  "Big goals, no clear plan",
  "Overwhelmed by too many apps",
  "ADHD-friendly structure",
  "Need visible progress to stay motivated",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Type your goal",
    body: "Start with a real ambition like reading more, getting fitter, saving money, or launching something meaningful.",
  },
  {
    step: "02",
    title: "Let AI build the plan",
    body: "The app turns that goal into a structured path with steps, due dates, and a realistic sense of what comes first.",
  },
  {
    step: "03",
    title: "Track daily progress",
    body: "See your next action, follow your plan, and watch your goals, habits, and life systems move forward together.",
  },
];

const DIFFERENT_SECTION = [
  {
    title: "Not just tasks",
    body: "Most productivity tools stop at task lists. Daily Life Progress connects tasks to your actual goals and the life you want to build.",
  },
  {
    title: "Not just habits",
    body: "This is not another isolated habit tracker. It combines habits, goals, progress, schedule, and AI planning into one connected system.",
  },
  {
    title: "Not just motivation",
    body: "When motivation disappears, structure matters. The app helps reduce overwhelm by giving you clarity, momentum, and a visible sense of progress.",
  },
];

const PRICING_PLANS = [
  {
    name: "Free",
    sub: "Get started and build momentum",
    monthly: 0,
    yearly: 0,
    featured: false,
    cta: "Start free",
    points: [
      "Core life dashboard",
      "Manual goals and tracking",
      "Basic progress visibility",
      "10 AI prompts / month",
    ],
  },
  {
    name: "Pro",
    sub: "For serious self-improvement",
    monthly: 9,
    yearly: 89,
    featured: true,
    cta: "Get Pro",
    points: [
      "Everything in Free",
      "200 AI prompts / month",
      "AI goal generation",
      "AI step breakdown",
      "AI suggestions",
      "Basic memory + personalization",
    ],
  },
  {
    name: "Pro Max",
    sub: "Your AI life coach",
    monthly: 19,
    yearly: 189,
    featured: false,
    cta: "Get Pro Max",
    points: [
      "Everything in Pro",
      "1000 AI prompts / month",
      "Persistent AI memory",
      "Weekly AI life reports",
      "Deep insights + personalization",
      "Advanced coaching + recommendations",
    ],
  },
];

function FeatureCard({
  tokens,
  icon,
  title,
  body,
  accent,
  index,
}: {
  tokens: Tokens;
  icon: string;
  title: string;
  body: string;
  accent: "primary" | "blue" | "amber" | "purple";
  index: number;
}) {
  const { ref, visible } = useReveal();
  const accentColor = tokens[accent];

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s ease ${index * 0.08}s, transform 0.55s ease ${index * 0.08}s`,
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 20,
        padding: "28px 24px",
        boxShadow: tokens.shadow,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -50,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: accentColor,
          opacity: 0.08,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accentColor,
          fontSize: 20,
          marginBottom: 16,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: tokens.text,
          marginBottom: 10,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.75,
          color: tokens.muted,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function HowItWorksCard({
  tokens,
  step,
  title,
  body,
  index,
}: {
  tokens: Tokens;
  step: string;
  title: string;
  body: string;
  index: number;
}) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.55s ease ${index * 0.08}s, transform 0.55s ease ${index * 0.08}s`,
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 20,
        padding: "24px 22px",
      }}
    >
      <div
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: tokens.primary,
          letterSpacing: "0.12em",
          marginBottom: 14,
        }}
      >
        STEP {step}
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: tokens.text,
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.75,
          color: tokens.muted,
        }}
      >
        {body}
      </div>
    </div>
  );
}

function PersonaPill({ label, tokens }: { label: string; tokens: Tokens }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: `1px solid ${tokens.border}`,
        background: tokens.surface3,
        color: tokens.muted,
        fontSize: 12.5,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}

function HeroProductPreview({ tokens }: { tokens: Tokens }) {
  return (
    <div
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.borderStrong}`,
        borderRadius: 24,
        padding: 18,
        boxShadow: tokens.shadow,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: tokens.rose, opacity: 0.7 }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: tokens.amber, opacity: 0.7 }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: tokens.primary, opacity: 0.8 }} />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 10,
            color: tokens.faint,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          Daily Life Progress
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.95fr",
          gap: 14,
        }}
      >
        <div
          style={{
            background: tokens.bgSoft,
            border: `1px solid ${tokens.border}`,
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: tokens.faint,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            AI GOAL PLANNER
          </div>

          <div
            style={{
              background: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: 14,
              padding: "12px 12px",
              color: tokens.text,
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            I want to run a marathon by October
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {[5, 8, 10].map((n, i) => (
              <div
                key={n}
                style={{
                  borderRadius: 999,
                  padding: "6px 10px",
                  fontSize: 11,
                  border: `1px solid ${i === 1 ? tokens.primaryBorder : tokens.border}`,
                  background: i === 1 ? tokens.primarySoft : tokens.surface,
                  color: i === 1 ? tokens.primary : tokens.muted,
                }}
              >
                {n} steps
              </div>
            ))}
          </div>

          <div
            style={{
              background: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: 16,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 22 }}>🏃</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: tokens.text }}>
                  Marathon by October
                </div>
                <div style={{ fontSize: 12, color: tokens.muted }}>
                  AI plan generated · review before saving
                </div>
              </div>
            </div>

            {[
              "Choose your marathon race",
              "Build base mileage",
              "Add a weekly long run",
              "Practice fueling and pacing",
            ].map((item, i) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: i === 0 ? tokens.primarySoft : tokens.surface3,
                    border: `1px solid ${i === 0 ? tokens.primaryBorder : tokens.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: i === 0 ? tokens.primary : tokens.muted,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 13, color: tokens.textSoft }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              background: tokens.bgSoft,
              border: `1px solid ${tokens.border}`,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: tokens.faint,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.08em",
                marginBottom: 10,
              }}
            >
              NEXT BEST ACTION
            </div>

            <div
              style={{
                borderRadius: 16,
                padding: 14,
                background: tokens.surface,
                border: `1px solid ${tokens.primaryBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: tokens.primary,
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                Today
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: tokens.text,
                  marginBottom: 6,
                  letterSpacing: "-0.02em",
                }}
              >
                Run 4 km after work
              </div>
              <div style={{ fontSize: 12, color: tokens.muted }}>
                30 minutes · keeps your marathon plan on track
              </div>
            </div>
          </div>

          <div
            style={{
              background: tokens.bgSoft,
              border: `1px solid ${tokens.border}`,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: tokens.faint,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              LIFE PROGRESS
            </div>

            {[
              ["Goals", 72, tokens.primary],
              ["Fitness", 81, tokens.blue],
              ["Reading", 64, tokens.amber],
              ["Consistency", 76, tokens.purple],
            ].map(([label, pct, color]) => (
              <div key={label as string} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: tokens.muted }}>{label}</span>
                  <span style={{ color: tokens.textSoft }}>{pct}%</span>
                </div>
                <div
                  style={{
                    height: 7,
                    background: tokens.surface,
                    borderRadius: 999,
                    overflow: "hidden",
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: color as string,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: tokens.bgSoft,
              border: `1px solid ${tokens.border}`,
              borderRadius: 18,
              padding: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: tokens.faint,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.08em",
                marginBottom: 10,
              }}
            >
              WHY PEOPLE STAY
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {[
                "You know what to do next",
                "You can see your momentum",
                "Your daily actions feel connected",
              ].map((line) => (
                <div
                  key={line}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontSize: 12.5,
                    color: tokens.textSoft,
                  }}
                >
                  <span style={{ color: tokens.primary }}>●</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  tokens,
  billing,
  name,
  sub,
  monthly,
  yearly,
  featured,
  cta,
  points,
}: {
  tokens: Tokens;
  billing: BillingMode;
  name: string;
  sub: string;
  monthly: number;
  yearly: number;
  featured: boolean;
  cta: string;
  points: string[];
}) {
  const isFree = monthly === 0;
  const displayPrice = billing === "monthly" ? monthly : yearly;
  const helperMonthly =
    !isFree && billing === "yearly" ? `$${(yearly / 12).toFixed(2)}/mo billed yearly` : null;

  return (
    <div
      style={{
        background: featured ? tokens.primarySoft : tokens.surface,
        border: `1px solid ${featured ? tokens.primaryBorder : tokens.border}`,
        borderRadius: 22,
        padding: "28px 24px",
        position: "relative",
        boxShadow: featured ? tokens.shadow : "none",
      }}
    >
      {featured && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            borderRadius: 999,
            padding: "6px 10px",
            background: tokens.primarySoft,
            border: `1px solid ${tokens.primaryBorder}`,
            color: tokens.primary,
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.08em",
          }}
        >
          MOST POPULAR
        </div>
      )}

      <div style={{ fontSize: 20, fontWeight: 700, color: tokens.text, marginBottom: 6 }}>
        {name}
      </div>
      <div style={{ color: tokens.muted, fontSize: 13.5, lineHeight: 1.6, marginBottom: 18 }}>
        {sub}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 42,
            lineHeight: 1,
            color: tokens.text,
            fontFamily: "'Instrument Serif', serif",
          }}
        >
          ${displayPrice}
        </div>
        {!isFree && (
          <div style={{ fontSize: 13, color: tokens.faint, marginBottom: 4 }}>
            /{billing === "monthly" ? "mo" : "yr"}
          </div>
        )}
      </div>

      <div style={{ minHeight: 20, marginBottom: 18, fontSize: 12.5, color: tokens.primary }}>
        {isFree
          ? "No credit card required"
          : billing === "yearly"
            ? `${helperMonthly} · save 17%`
            : `or $${yearly}/year · save 17%`}
      </div>

      <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        {points.map((point) => (
          <div key={point} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: tokens.primary, marginTop: 2 }}>●</span>
            <span style={{ color: tokens.textSoft, fontSize: 13.5, lineHeight: 1.65 }}>{point}</span>
          </div>
        ))}
      </div>

      <button
        style={{
          width: "100%",
          background: featured ? tokens.primary : tokens.text,
          color: featured ? "#052e16" : tokens.bg,
          border: "none",
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          transition: "transform 0.15s ease, opacity 0.15s ease",
        }}
      >
        {cta}
      </button>
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [billing, setBilling] = useState<BillingMode>("monthly");
  const [scrolled, setScrolled] = useState(false);

  const { ref: howRef, visible: howVisible } = useReveal();
  const { ref: featRef, visible: featVisible } = useReveal();
  const { ref: diffRef, visible: diffVisible } = useReveal();
  const { ref: ctaRef, visible: ctaVisible } = useReveal();

  useEffect(() => {
    const stored = localStorage.getItem("landing-theme") as ThemeMode | null;
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    localStorage.setItem("landing-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const t = TOKENS[theme];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: "'DM Sans', sans-serif",
        overflowX: "hidden",
        transition: "background 0.25s ease, color 0.25s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        .hero-enter-1 { animation: fadeUp 0.7s ease 0.05s both; }
        .hero-enter-2 { animation: fadeUp 0.7s ease 0.18s both; }
        .hero-enter-3 { animation: fadeUp 0.7s ease 0.3s both; }
        .hero-enter-4 { animation: fadeUp 0.8s ease 0.45s both; }
      `}</style>

      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          backdropFilter: "blur(14px)",
          background: scrolled
            ? theme === "dark"
              ? "rgba(6,11,20,0.82)"
              : "rgba(248,250,252,0.86)"
            : "transparent",
          borderBottom: scrolled ? `1px solid ${t.border}` : "1px solid transparent",
          transition: "background 0.25s ease, border-color 0.25s ease",
        }}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            background: "transparent",
            border: "none",
            color: t.text,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace",
            fontSize: 14,
            letterSpacing: "0.06em",
          }}
        >
          DAILY<span style={{ color: t.primary }}> LIFE</span> PROGRESS
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "none",
              gap: 8,
            }}
          />

          <button
            onClick={() => scrollTo("features")}
            style={{
              background: "transparent",
              border: "none",
              color: t.muted,
              fontSize: 13,
              cursor: "pointer",
              display: window.innerWidth > 900 ? "inline-block" : "none",
            }}
          >
            Features
          </button>

          <button
            onClick={() => scrollTo("pricing")}
            style={{
              background: "transparent",
              border: "none",
              color: t.muted,
              fontSize: 13,
              cursor: "pointer",
              display: window.innerWidth > 900 ? "inline-block" : "none",
            }}
          >
            Pricing
          </button>

          <button
            onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            aria-label="Toggle theme"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          <button
            onClick={() => navigate("/auth")}
            style={{
              background: "transparent",
              border: `1px solid ${t.border}`,
              color: t.textSoft,
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign in
          </button>

          <button
            onClick={() => navigate("/auth")}
            style={{
              background: t.text,
              color: t.bg,
              border: "none",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Start free
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          padding: "120px 24px 90px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: t.heroGlow,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: 36,
            alignItems: "center",
          }}
        >
          <div>
            <div className="hero-enter-1">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: t.primarySoft,
                  border: `1px solid ${t.primaryBorder}`,
                  color: t.primary,
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  marginBottom: 26,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: t.primary,
                  }}
                />
                AI LIFE SYSTEM
              </div>
            </div>

            <div className="hero-enter-2">
              <h1
                style={{
                  fontSize: "clamp(42px, 8vw, 80px)",
                  fontFamily: "'Instrument Serif', serif",
                  fontWeight: 400,
                  lineHeight: 0.98,
                  letterSpacing: "-0.04em",
                  color: t.text,
                  marginBottom: 18,
                }}
              >
                Turn your life goals
                <br />
                <em style={{ color: t.primary, fontStyle: "italic" }}>into daily progress.</em>
              </h1>
            </div>

            <div className="hero-enter-3">
              <p
                style={{
                  fontSize: "clamp(16px, 2vw, 19px)",
                  lineHeight: 1.8,
                  color: t.muted,
                  maxWidth: 680,
                  marginBottom: 12,
                }}
              >
                Break big ambitions into clear daily steps with an AI-powered life dashboard.
              </p>

              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: t.faint,
                  maxWidth: 720,
                  marginBottom: 28,
                }}
              >
                Goals, habits, fitness, learning and finances — all connected so you can see your real progress and always know what to do next.
              </p>
            </div>

            <div className="hero-enter-4">
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 24,
                }}
              >
                <button
                  onClick={() => navigate("/auth")}
                  style={{
                    background: t.primary,
                    color: theme === "dark" ? "#052e16" : "#ffffff",
                    border: "none",
                    borderRadius: 14,
                    padding: "14px 20px",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Start for free →
                </button>

                <button
                  onClick={() => scrollTo("how-it-works")}
                  style={{
                    background: "transparent",
                    color: t.textSoft,
                    border: `1px solid ${t.borderStrong}`,
                    borderRadius: 14,
                    padding: "14px 20px",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  See how it works
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  maxWidth: 760,
                }}
              >
                {PERSONA_PILLS.map((label) => (
                  <PersonaPill key={label} label={label} tokens={t} />
                ))}
              </div>
            </div>
          </div>

          <div
            className="hero-enter-4"
            style={{
              animation: "floatSlow 6s ease-in-out infinite",
            }}
          >
            <HeroProductPreview tokens={t} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        style={{
          padding: "90px 24px",
          maxWidth: 1160,
          margin: "0 auto",
        }}
      >
        <div
          ref={howRef}
          style={{
            textAlign: "center",
            marginBottom: 44,
            opacity: howVisible ? 1 : 0,
            transform: howVisible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: t.faint,
              letterSpacing: "0.12em",
              marginBottom: 14,
            }}
          >
            HOW IT WORKS
          </div>

          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 46px)",
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: t.text,
              marginBottom: 12,
            }}
          >
            From overwhelming ambition
            <br />
            <em style={{ color: t.primary }}>to clear daily momentum.</em>
          </h2>

          <p
            style={{
              maxWidth: 700,
              margin: "0 auto",
              fontSize: 15,
              lineHeight: 1.8,
              color: t.faint,
            }}
          >
            The product is designed around one feeling: helping users stop wondering where to start and start making visible progress.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {HOW_IT_WORKS.map((item, i) => (
            <HowItWorksCard key={item.step} tokens={t} index={i} {...item} />
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        style={{
          padding: "90px 24px",
          maxWidth: 1160,
          margin: "0 auto",
        }}
      >
        <div
          ref={featRef}
          style={{
            textAlign: "center",
            marginBottom: 50,
            opacity: featVisible ? 1 : 0,
            transform: featVisible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: t.faint,
              letterSpacing: "0.12em",
              marginBottom: 14,
            }}
          >
            WHY IT FEELS DIFFERENT
          </div>

          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 46px)",
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: t.text,
            }}
          >
            Not another task manager.
            <br />
            <em style={{ color: t.primary }}>A system that helps you move your life forward.</em>
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {FEATURE_CARDS.map((item, i) => (
            <FeatureCard key={item.title} tokens={t} index={i} {...item} />
          ))}
        </div>
      </section>

      {/* DIFFERENT */}
      <section
        style={{
          padding: "40px 24px 90px",
          maxWidth: 1160,
          margin: "0 auto",
        }}
      >
        <div
          ref={diffRef}
          style={{
            background: t.surface,
            border: `1px solid ${t.border}`,
            borderRadius: 28,
            padding: "30px 24px",
            opacity: diffVisible ? 1 : 0,
            transform: diffVisible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: t.faint,
              letterSpacing: "0.12em",
              marginBottom: 18,
              textAlign: "center",
            }}
          >
            FOR PEOPLE WHO THINK “I’VE SEEN THIS BEFORE”
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}
          >
            {DIFFERENT_SECTION.map((item) => (
              <div
                key={item.title}
                style={{
                  padding: 18,
                  borderRadius: 18,
                  background: t.surface3,
                  border: `1px solid ${t.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: t.text,
                    marginBottom: 8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: t.muted,
                    lineHeight: 1.75,
                  }}
                >
                  {item.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        style={{
          padding: "90px 24px",
          maxWidth: 1160,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: t.faint,
              letterSpacing: "0.12em",
              marginBottom: 14,
            }}
          >
            PRICING
          </div>

          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 46px)",
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: t.text,
              marginBottom: 12,
            }}
          >
            Start free.
            <br />
            <em style={{ color: t.primary }}>Upgrade when you want more AI guidance.</em>
          </h2>

          <p
            style={{
              maxWidth: 690,
              margin: "0 auto 20px",
              fontSize: 15,
              lineHeight: 1.8,
              color: t.faint,
            }}
          >
            Use the core system for free, unlock more prompts and personalization with Pro, or get a true AI life coach with Pro Max.
          </p>

          <div
            style={{
              display: "inline-flex",
              padding: 6,
              borderRadius: 999,
              background: t.surface,
              border: `1px solid ${t.border}`,
              gap: 6,
            }}
          >
            {(["monthly", "yearly"] as BillingMode[]).map((mode) => {
              const active = billing === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setBilling(mode)}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 999,
                    padding: "10px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    background: active ? t.primarySoft : "transparent",
                    color: active ? t.primary : t.muted,
                  }}
                >
                  {mode === "monthly" ? "Monthly" : "Yearly · save 17%"}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.name} tokens={t} billing={billing} {...plan} />
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        style={{
          padding: "110px 24px 120px",
          position: "relative",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: t.heroGlow,
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />

        <div
          ref={ctaRef}
          style={{
            position: "relative",
            maxWidth: 860,
            margin: "0 auto",
            opacity: ctaVisible ? 1 : 0,
            transform: ctaVisible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(34px, 5vw, 58px)",
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              color: t.text,
              marginBottom: 16,
            }}
          >
            Stop feeling behind.
            <br />
            <em style={{ color: t.primary }}>Start making visible progress.</em>
          </h2>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: t.faint,
              maxWidth: 640,
              margin: "0 auto 30px",
            }}
          >
            Daily Life Progress is built for people with meaningful ambitions, busy lives, and brains that need clarity more than more noise.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate("/auth")}
              style={{
                background: t.primary,
                color: theme === "dark" ? "#052e16" : "#ffffff",
                border: "none",
                borderRadius: 14,
                padding: "15px 22px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create your account →
            </button>

            <button
              onClick={() => scrollTo("pricing")}
              style={{
                background: "transparent",
                color: t.textSoft,
                border: `1px solid ${t.borderStrong}`,
                borderRadius: 14,
                padding: "15px 22px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              See pricing
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: `1px solid ${t.border}`,
          padding: "28px 24px 36px",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: t.faint,
              letterSpacing: "0.06em",
            }}
          >
            DAILY<span style={{ color: t.primary }}> LIFE</span> PROGRESS
          </div>

          <div
            style={{
              fontSize: 12,
              color: t.faint,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </div>
  );
}