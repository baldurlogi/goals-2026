import { useEffect, useMemo, useState } from "react";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/authContext";
import { captureOnce } from "@/lib/analytics";
import { supabase } from "@/lib/supabaseClient";
import {
  clearStoredPostLoginRedirect,
  readStoredPostLoginRedirect,
  resolvePostAuthDestination,
  resolvePostLoginPath,
} from "./authRedirect";
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

export function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExchangingCode, setIsExchangingCode] = useState(false);
  const hasAuthCode = useMemo(() => {
    return new URLSearchParams(location.search).has("code");
  }, [location.search]);

  useEffect(() => {
    if (loading || user) return;

    const params = new URLSearchParams(location.search);
    const code = params.get("code");
    if (!code) return;

    let cancelled = false;
    setIsExchangingCode(true);

    void supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
      if (cancelled) return;

      if (error) {
        console.warn("[auth] native code exchange failed", error);
        setIsExchangingCode(false);
        return;
      }

      if (Capacitor.isNativePlatform()) {
        try {
          await Browser.close();
        } catch {
          // ignore
        }
      }

      setIsExchangingCode(false);
    });

    return () => {
      cancelled = true;
    };
  }, [loading, location.search, user]);

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

    const queryPath = resolvePostLoginPath(params.get("next"));
    const persistedPath = readStoredPostLoginRedirect();
    const destination = resolvePostAuthDestination(
      queryPath,
      resolvePostLoginPath(statePath),
      persistedPath,
    );

    if (import.meta.env.DEV) {
      console.debug("[auth] callback redirect resolved", {
        intent,
        queryPath,
        statePath: resolvePostLoginPath(statePath),
        persistedPath,
        destination,
      });
    }

    clearStoredPostLoginRedirect();
    navigate(destination, { replace: true });
  }, [loading, user, navigate, location.search, location.state]);

  if (loading || isExchangingCode || (!user && hasAuthCode)) {
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
