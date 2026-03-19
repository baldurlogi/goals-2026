import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/authContext";
import { captureOnce } from "@/lib/analytics";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";
const SIGNUP_WINDOW_MS = 5 * 60 * 1000;

function isLikelySignup(user: {
  created_at?: string;
  last_sign_in_at?: string;
}): boolean {
  const createdAt = user.created_at ? Date.parse(user.created_at) : Number.NaN;
  const lastSignInAt = user.last_sign_in_at
    ? Date.parse(user.last_sign_in_at)
    : Number.NaN;

  if (Number.isNaN(createdAt) || Number.isNaN(lastSignInAt)) return false;
  return Math.abs(lastSignInAt - createdAt) <= SIGNUP_WINDOW_MS;
}

function resolvePostLoginPath(value: unknown) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/auth")) return null;
  return value;
}

export function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;

    const params = new URLSearchParams(location.search);
    const intent = params.get("intent");

    const shouldTrackSignup =
      intent === "signup" || (intent !== "login" && isLikelySignup(user));

    if (shouldTrackSignup) {
      captureOnce("signup_completed", user.id, {
        method: "google",
        intent: intent ?? "unknown",
        source: "auth_callback",
        route: "/auth/callback",
      });
    } else {
      captureOnce("login_completed", user.id, {
        method: "google",
        intent: intent ?? "unknown",
        source: "auth_callback",
        route: "/auth/callback",
      });
    }

    const state = location.state as {
      from?: { pathname?: string; search?: string; hash?: string };
    } | null;

    const statePath = state?.from
      ? `${state.from.pathname ?? ""}${state.from.search ?? ""}${state.from.hash ?? ""}`
      : null;

    const persistedPath = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
    const destination =
      resolvePostLoginPath(statePath) ??
      resolvePostLoginPath(persistedPath) ??
      "/app";

    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    navigate(destination, { replace: true });
  }, [loading, user, navigate, location.search, location.state]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Signing you in…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return null;
}