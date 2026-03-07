import { Navigate } from "react-router-dom";
import { useAuth } from "./authContext";

/**
 * Wrap public-only routes (/ and /auth) with this.
 * Logged-in users are redirected straight to /app.
 * While auth is resolving we render nothing — the flash is imperceptible.
 */
export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}