import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ── Types ─────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** If provided, renders this instead of the default fallback */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Use "card" for per-card boundaries, "page" for full-page (default) */
  variant?: "page" | "card";
  /** Optional label shown in the fallback UI, e.g. "Upcoming Goals" */
  label?: string;
}

interface State {
  error: Error | null;
}

// ── Component ─────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Swap for a real logger (Sentry etc.) before production
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { children, fallback, variant = "page", label } = this.props;

    if (!error) return children;

    if (fallback) return fallback(error, this.reset);

    if (variant === "card") {
      return <CardErrorFallback error={error} onRetry={this.reset} label={label} />;
    }

    return <PageErrorFallback error={error} onRetry={this.reset} />;
  }
}

// ── Per-card fallback ─────────────────────────────────────────────────────

export function CardErrorFallback({
  error,
  onRetry,
  label,
  colSpan,
}: {
  error?: Error;
  onRetry: () => void;
  label?: string;
  colSpan?: string;
}) {
  return (
    <Card className={`overflow-hidden ${colSpan ?? ""}`}>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {label ? `Couldn't load ${label}` : "Something went wrong"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {error?.message ?? "An unexpected error occurred."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={onRetry}
        >
          <RefreshCw className="h-3 w-3" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Full-page fallback ────────────────────────────────────────────────────

function PageErrorFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error crashed this page. Your data is safe.
        </p>
        {error.message && (
          <p className="mt-2 rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/app")}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}