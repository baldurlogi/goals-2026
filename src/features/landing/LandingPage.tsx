import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ── tiny hook: intersection observer for scroll reveals ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ── feature data ── */
const FEATURES = [
  {
    icon: "◎",
    title: "Goal modules",
    body: "Track every goal you're serious about — marathon training, SaaS launch, university applications, skincare streaks. Each with its own dashboard, auto-rolling periods, and progress metrics.",
    accent: "#4ade80",
  },
  {
    icon: "▦",
    title: "Daily schedule",
    body: "WFH, office, weekend — three views that adapt to how your day actually runs. Time-blocked, macro-aware, built around your commute.",
    accent: "#60a5fa",
  },
  {
    icon: "◈",
    title: "Finance tracker",
    body: "Monthly budget by category, savings progress, spending donut chart. See exactly where money goes without opening a spreadsheet.",
    accent: "#f59e0b",
  },
  {
    icon: "◐",
    title: "Nutrition & fitness",
    body: "TDEE-calculated macro targets, workout streak, weekly split. Numbers based on your body — not a generic 2000 kcal default.",
    accent: "#e879f9",
  },
];

/* ── mock dashboard screenshot ── */
function MockDashboard() {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "20px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 11,
        color: "#94a3b8",
        boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      {/* top bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, alignItems: "center" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", opacity: 0.7 }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", opacity: 0.7 }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e", opacity: 0.7 }} />
        <div style={{ flex: 1, textAlign: "center", color: "#334155", fontSize: 10 }}>life-os.app</div>
      </div>

      {/* tab row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["🥗 Nutrition", "📅 Schedule", "📖 Reading", "🎯 Goals"].map((t, i) => (
          <div key={t} style={{
            padding: "5px 10px", borderRadius: 8, fontSize: 10,
            background: i === 3 ? "rgba(255,255,255,0.08)" : "transparent",
            border: i === 3 ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
            color: i === 3 ? "#f1f5f9" : "#475569",
          }}>{t}</div>
        ))}
      </div>

      {/* cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* revenue card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 }}>
          <div style={{ color: "#64748b", fontSize: 9, marginBottom: 6 }}>💰 Revenue (this month)</div>
          <div style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>32,400</div>
          <div style={{ color: "#64748b", fontSize: 9, marginBottom: 8 }}>/ 40,000 DKK</div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4 }}>
            <div style={{ width: "81%", height: "100%", background: "#4ade80", borderRadius: 4 }} />
          </div>
          <div style={{ color: "#4ade80", fontSize: 9, marginTop: 4 }}>81%</div>
        </div>

        {/* streak card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 }}>
          <div style={{ color: "#64748b", fontSize: 9, marginBottom: 6 }}>🔥 Workout streak</div>
          <div style={{ color: "#f1f5f9", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>14</div>
          <div style={{ color: "#64748b", fontSize: 9, marginBottom: 10 }}>days</div>
          <div style={{ display: "inline-block", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 6, padding: "3px 7px", color: "#4ade80", fontSize: 9 }}>Logged today</div>
        </div>

        {/* budget card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 }}>
          <div style={{ color: "#64748b", fontSize: 9, marginBottom: 8 }}>📊 Spending breakdown</div>
          {[["Rent", "8,500", 85, "#60a5fa"], ["Groceries", "1,840", 46, "#4ade80"], ["Food & Drinks", "2,100", 84, "#f59e0b"]].map(([label, val, pct, color]) => (
            <div key={label as string} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#475569", fontSize: 8 }}>{label}</span>
                <span style={{ color: "#94a3b8", fontSize: 8 }}>{val}</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <div style={{ width: `${pct}%`, height: "100%", background: color as string, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* macros card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 }}>
          <div style={{ color: "#64748b", fontSize: 9, marginBottom: 8 }}>🥗 Macro targets</div>
          {[["Calories", "2,540 kcal", "#e879f9"], ["Protein", "178 g", "#60a5fa"], ["Carbs", "248 g", "#f59e0b"], ["Fat", "68 g", "#4ade80"]].map(([label, val, color]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#475569", fontSize: 8 }}>{label}</span>
              <span style={{ color: color as string, fontSize: 8, fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── feature card ── */
function FeatureCard({ icon, title, body, accent, index }: typeof FEATURES[0] & { index: number }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: "32px 28px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* accent glow */}
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 120, height: 120, borderRadius: "50%",
        background: accent, opacity: 0.06, filter: "blur(30px)",
        pointerEvents: "none",
      }} />
      <div style={{
        fontFamily: "monospace", fontSize: 28,
        color: accent, marginBottom: 16, lineHeight: 1,
      }}>{icon}</div>
      <div style={{
        fontSize: 16, fontWeight: 600, color: "#f1f5f9",
        marginBottom: 10, letterSpacing: "-0.02em",
        fontFamily: "'DM Sans', sans-serif",
      }}>{title}</div>
      <div style={{
        fontSize: 13.5, color: "#64748b", lineHeight: 1.7,
        fontFamily: "'DM Sans', sans-serif",
      }}>{body}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN LANDING PAGE
══════════════════════════════════════════════ */
export function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { ref: featRef, visible: featVisible } = useReveal();
  const { ref: ctaRef, visible: ctaVisible } = useReveal();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060b14",
      color: "#f1f5f9",
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "hidden",
    }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #060b14; }

        .cta-btn {
          background: #f1f5f9;
          color: #060b14;
          border: none;
          border-radius: 10px;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
          letter-spacing: -0.01em;
        }
        .cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(241,245,249,0.15);
          background: #ffffff;
        }
        .cta-btn-ghost {
          background: transparent;
          color: #94a3b8;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          letter-spacing: -0.01em;
        }
        .cta-btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: #f1f5f9; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-headline { animation: fadeUp 0.8s ease 0.1s both; }
        .hero-sub      { animation: fadeUp 0.8s ease 0.25s both; }
        .hero-ctas     { animation: fadeUp 0.8s ease 0.4s both; }
        .hero-img      { animation: fadeUp 0.9s ease 0.55s both; }

        .noise-overlay {
          position: fixed; inset: 0; pointer-events: none; z-index: 0; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="noise-overlay" />

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "0 32px",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(6,11,20,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
        transition: "background 0.3s, border-color 0.3s, backdrop-filter 0.3s",
      }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#f1f5f9", letterSpacing: "0.05em" }}>
          LIFE<span style={{ color: "#4ade80" }}>OS</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className="cta-btn-ghost" style={{ padding: "8px 20px", fontSize: 13 }}
            onClick={() => navigate("/auth")}>
            Sign in
          </button>
          <button className="cta-btn" style={{ padding: "8px 20px", fontSize: 13 }}
            onClick={() => navigate("/auth")}>
            Get started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{
        minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "100px 24px 80px",
        position: "relative",
        textAlign: "center",
      }}>
        {/* radial glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: 600, height: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="hero-headline" style={{ maxWidth: 780, position: "relative" }}>
          {/* eyebrow */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
            background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: 100, padding: "6px 16px",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
              YOUR LIFE, TRACKED
            </span>
          </div>

          <h1 style={{
            fontSize: "clamp(44px, 8vw, 88px)",
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#f8fafc",
            marginBottom: 8,
          }}>
            One place for
          </h1>
          <h1 style={{
            fontSize: "clamp(44px, 8vw, 88px)",
            fontFamily: "'Instrument Serif', serif",
            fontStyle: "italic",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "#4ade80",
            marginBottom: 28,
          }}>
            everything that matters.
          </h1>
        </div>

        <p className="hero-sub" style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          color: "#64748b",
          lineHeight: 1.75,
          maxWidth: 520,
          marginBottom: 44,
        }}>
          Goals, schedule, finances, fitness, nutrition — all in a single dashboard
          built around your actual life. No spreadsheets. No juggling apps.
        </p>

        <div className="hero-ctas" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button className="cta-btn" onClick={() => navigate("/auth")}>
            Start for free →
          </button>
          <button className="cta-btn-ghost" onClick={() => {
            document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
          }}>
            See what's inside
          </button>
        </div>

        {/* screenshot */}
        <div className="hero-img" style={{
          marginTop: 72, width: "100%", maxWidth: 780,
          animation: "float 6s ease-in-out infinite",
          position: "relative",
        }}>
          {/* glow behind card */}
          <div style={{
            position: "absolute", inset: "-20px",
            background: "radial-gradient(ellipse at 50% 60%, rgba(74,222,128,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <MockDashboard />
        </div>

        {/* scroll hint */}
        <div style={{
          marginTop: 56,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          color: "#334155", fontSize: 11, fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.1em",
        }}>
          <div>SCROLL</div>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, #334155, transparent)" }} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div ref={featRef} style={{
          textAlign: "center", marginBottom: 64,
          opacity: featVisible ? 1 : 0,
          transform: featVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: "#334155", letterSpacing: "0.12em", marginBottom: 16,
          }}>WHAT'S INSIDE</div>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400, letterSpacing: "-0.02em",
            color: "#f1f5f9", lineHeight: 1.15,
          }}>
            Built for people who are<br />
            <em>serious about their goals.</em>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "48px 24px",
      }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 32, textAlign: "center",
        }}>
          {[
            ["8", "goal modules", "marathon to SaaS to university"],
            ["1", "dashboard", "not 6 separate apps"],
            ["0", "generic defaults", "every number is yours"],
          ].map(([num, label, sub]) => (
            <div key={label}>
              <div style={{
                fontSize: "clamp(36px, 5vw, 56px)",
                fontFamily: "'Instrument Serif', serif",
                color: "#f1f5f9", lineHeight: 1,
                letterSpacing: "-0.03em",
                marginBottom: 6,
              }}>{num}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: "#334155", fontFamily: "'DM Mono', monospace" }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "120px 24px", textAlign: "center", position: "relative" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500, height: 300,
          background: "radial-gradient(ellipse, rgba(74,222,128,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div ref={ctaRef} style={{
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          position: "relative",
        }}>
          <h2 style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontFamily: "'Instrument Serif', serif",
            fontWeight: 400, letterSpacing: "-0.03em",
            color: "#f8fafc", lineHeight: 1.1, marginBottom: 20,
          }}>
            Stop planning to start.<br />
            <em style={{ color: "#4ade80" }}>Start today.</em>
          </h2>
          <p style={{ color: "#475569", fontSize: 15, marginBottom: 40, lineHeight: 1.7 }}>
            Free to use. No credit card. Takes 2 minutes to set up.
          </p>
          <button className="cta-btn" style={{ fontSize: 16, padding: "16px 40px" }}
            onClick={() => navigate("/app")}>
            Create your Life OS →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.04)",
        padding: "32px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16,
        maxWidth: 1100, margin: "0 auto",
      }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#1e293b" }}>
          LIFE<span style={{ color: "#334155" }}>OS</span>
        </div>
        <div style={{ fontSize: 12, color: "#1e293b", fontFamily: "'DM Mono', monospace" }}>
          © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}