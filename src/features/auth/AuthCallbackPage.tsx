import { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/authContext";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";

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
    if (!loading && user) {
      const state = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null;
      const statePath = state?.from
        ? `${state.from.pathname ?? ""}${state.from.search ?? ""}${state.from.hash ?? ""}`
        : null;
      const persistedPath = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
      const destination = resolvePostLoginPath(statePath) ?? resolvePostLoginPath(persistedPath) ?? "/app";

      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
      navigate(destination, { replace: true });
    }
  }, [loading, user, navigate, location.state]);

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
