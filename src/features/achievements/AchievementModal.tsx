import { useEffect, useRef, type CSSProperties } from "react";
import { X } from "lucide-react";
import { RARITY_CONFIG } from "./achievementConfig";
import { ACHIEVEMENTS } from "./achievementList";
import { useAchievements } from "./useAchievements";

type ConfettiParticle = {
  id: number;
  color: string;
  left: string;
  delay: string;
  duration: string;
  size: string;
  rotation: string;
  borderRadius: string;
};

const CONFETTI_COLORS = [
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f43f5e",
  "#3b82f6",
  "#ec4899",
  "#84cc16",
];

function seeded(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

function createParticles(count = 48): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => {
    const leftRand = seeded(i + 1);
    const delayRand = seeded(i + 101);
    const durationRand = seeded(i + 201);
    const sizeRand = seeded(i + 301);
    const rotationRand = seeded(i + 401);
    const shapeRand = seeded(i + 501);

    return {
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${leftRand * 100}%`,
      delay: `${delayRand * 0.8}s`,
      duration: `${0.8 + durationRand * 1}s`,
      size: `${4 + sizeRand * 6}px`,
      rotation: `${rotationRand * 720 - 360}deg`,
      borderRadius: shapeRand > 0.5 ? "50%" : "2px",
    };
  });
}

const CONFETTI_PARTICLES = createParticles();

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {CONFETTI_PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 animate-[confettiFall_var(--dur)_var(--delay)_ease-in_forwards]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.borderRadius,
            "--dur": p.duration,
            "--delay": p.delay,
            "--rot": p.rotation,
          } as CSSProperties}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(var(--rot, 360deg)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function StarBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="absolute h-1 w-8 origin-left animate-[starBurst_0.6s_ease-out_forwards] opacity-0"
          style={{
            transform: `rotate(${i * 45}deg)`,
            background:
              "linear-gradient(to right, rgba(251,191,36,0.8), transparent)",
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes starBurst {
          0%   { opacity: 0; transform: rotate(var(--r)) scaleX(0); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--r)) scaleX(1) translateX(8px); }
        }
      `}</style>
    </div>
  );
}

export function AchievementModal() {
  const { newlyUnlocked, dismissNew } = useAchievements();
  const overlayRef = useRef<HTMLDivElement>(null);

  const current = newlyUnlocked[0];
  const def = current ? ACHIEVEMENTS.find((a) => a.id === current.id) : null;

  useEffect(() => {
    if (!def) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissNew();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [def, dismissNew]);

  if (!def) return null;

  const rarity = RARITY_CONFIG[def.rarity];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ animation: "fadeIn 0.2s ease-out" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) dismissNew();
      }}
    >
      <Confetti />

      <div
        className={`relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl border bg-card p-8 text-center ${rarity.borderClass} ${rarity.glowClass}`}
        style={{
          animation: "scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <button
          type="button"
          onClick={dismissNew}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
          <StarBurst />
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full border-2 text-5xl ${rarity.borderClass}`}
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.05), transparent)",
            }}
          >
            {def.emoji}
          </div>
        </div>

        <span
          className={`mb-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${rarity.badgeClass}`}
        >
          {rarity.label}
        </span>

        <div className="text-xl font-bold tracking-tight">{def.title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{def.description}</div>

        <button
          type="button"
          onClick={dismissNew}
          className="mt-6 inline-flex rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Awesome
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes scaleIn {
          0%   { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
