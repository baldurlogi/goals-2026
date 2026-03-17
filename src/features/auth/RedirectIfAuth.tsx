import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext";

/**
 * Wrap public-only routes (/ and /auth) with this.
 * Logged-in users are redirected straight to /app.
 * While auth is resolving we show a tiny transition state to keep route changes explicit.
 */
export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="animate-pulse text-sm text-muted-foreground">Checking your account…</div>
      </div>
    );
  }

  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}
