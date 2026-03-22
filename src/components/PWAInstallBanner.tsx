import { Download, X, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { canInstall, triggerInstall, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div
      className={[
        // Position — fixed bottom bar, above any nav on mobile
        "fixed bottom-0 left-0 right-0 z-50",
        // Slide-up animation via Tailwind animate
        "animate-in slide-in-from-bottom duration-300",
      ].join(" ")}
    >
      {/* Backdrop blur strip */}
      <div className="border-t border-white/10 bg-slate-900/95 backdrop-blur-md px-4 py-3 shadow-2xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3">

          {/* Icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Smartphone className="h-4 w-4 text-emerald-400" />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white leading-tight">
              Add to Home Screen
            </p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Open Begyn instantly — no browser needed
            </p>
          </div>

          {/* Install button */}
          <button
            onClick={triggerInstall}
            className={[
              "shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5",
              "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600",
              "text-xs font-semibold text-white transition-colors",
            ].join(" ")}
          >
            <Download className="h-3 w-3" />
            Install
          </button>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      </div>
    </div>
  );
}
