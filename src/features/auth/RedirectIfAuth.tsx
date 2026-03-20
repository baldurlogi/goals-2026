import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";
import {
  clearStoredPostLoginRedirect,
  hasCancelledOnboarding,
  readStoredPostLoginRedirect,
  resolvePostLoginPath,
} from "./authRedirect";

export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="animate-pulse text-sm text-muted-foreground">
          Checking your account…
        </div>
      </div>
    );
  }

  if (user) {
    // Let signed-in users still visit the landing page.
    if (location.pathname === "/") {
      return <>{children}</>;
    }

    if (
      hasCancelledOnboarding() &&
      (location.pathname === "/login" || location.pathname === "/signup")
    ) {
      return <>{children}</>;
    }

    const state = location.state as {
      from?: { pathname?: string; search?: string; hash?: string };
    } | null;

    const statePath = state?.from
      ? `${state.from.pathname ?? ""}${state.from.search ?? ""}${state.from.hash ?? ""}`
      : null;

    const persistedPath = readStoredPostLoginRedirect();
    const destination =
      resolvePostLoginPath(statePath) ??
      resolvePostLoginPath(persistedPath) ??
      "/app";

    clearStoredPostLoginRedirect();
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}
