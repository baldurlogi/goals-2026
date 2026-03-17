import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";

function resolvePostLoginPath(value: unknown) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/auth")) return null;
  return value;
}

/**
 * Wrap public-only routes (/ and /auth) with this.
 * Logged-in users are redirected straight to /app.
 * While auth is resolving we show a tiny transition state to keep route changes explicit.
 */
export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="animate-pulse text-sm text-muted-foreground">Checking your account…</div>
      </div>
    );
  }

  if (user) {
    const state = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null;
    const statePath = state?.from
      ? `${state.from.pathname ?? ""}${state.from.search ?? ""}${state.from.hash ?? ""}`
      : null;
    const persistedPath = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    const destination = resolvePostLoginPath(statePath) ?? resolvePostLoginPath(persistedPath) ?? "/app";

    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}
