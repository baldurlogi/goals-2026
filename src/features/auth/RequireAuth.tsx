import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/authContext";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    // Preserve the intended destination so we can redirect back after login
    const nextPath = `${location.pathname}${location.search}${location.hash}`;
    if (nextPath.startsWith("/")) {
      sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, nextPath);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}