import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

type DashboardEmptyStateProps = {
  icon: ReactNode;
  title: string;
  message: string;
  actionLabel: string;
  href: string;
  hint?: string;
};

export function DashboardEmptyState({
  icon,
  title,
  message,
  actionLabel,
  href,
  hint = "Your AI coach gets sharper from one small signal.",
}: DashboardEmptyStateProps) {
  return (
    <div className="ai-layer-soft ai-reactive-edge rounded-2xl p-3 text-left transition-all duration-500 hover:bg-background/35">
      <div className="flex items-start gap-3">
        <div className="ai-layer-soft ai-float flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{message}</p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground/70">
          <Sparkles className="h-3 w-3 shrink-0 text-violet-400" />
          <span className="truncate">{hint}</span>
        </div>
        <Link
          to={href}
          className="flex max-w-[48%] shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <span className="min-w-0 truncate">{actionLabel}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
