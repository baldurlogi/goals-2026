import { useAuth } from "@/auth/authContext";
import { LoginPage } from "@/auth/LoginPage";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  return <>{children}</>;
}