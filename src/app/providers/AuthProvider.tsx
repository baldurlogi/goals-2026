import { useEffect, useRef, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import posthog from "posthog-js";

import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/features/auth/authContext";
import { clearUserCache } from "@/lib/clearUserCache";
import { getActiveUserId, setActiveUserId } from "@/lib/activeUser";
import { AUTH_USER_CHANGED_EVENT } from "@/lib/queryKeys";
import { clearUserBoundQueries } from "@/lib/queryClient";
import { clearProfileState } from "@/features/onboarding/profileStorage";

function hasCachedProfileMismatch(nextUserId: string | null): boolean {
  try {
    const activeUserId = getActiveUserId();
    const legacyRaw = localStorage.getItem("cache:profile:v1");
    if (legacyRaw && activeUserId === nextUserId) {
      const parsed = JSON.parse(legacyRaw) as { id?: unknown };
      const legacyId = typeof parsed.id === "string" ? parsed.id : null;

      if (
        (nextUserId === null && legacyId !== null) ||
        (nextUserId !== null && legacyId !== null && legacyId !== nextUserId)
      ) {
        return true;
      }
    }

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (
        key.startsWith("cache:profile:v2:") ||
        key.startsWith("cache:profile:v2:v1:")
      ) {
        if (nextUserId === null) return true;
        if (!key.endsWith(`:${nextUserId}`)) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  function syncAuthState(
    event: AuthChangeEvent | "INITIAL_SESSION",
    nextSession: Session | null,
    checkCacheMismatch = false,
  ) {
    const nextUser = nextSession?.user ?? null;
    const nextUserId = nextUser?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    const userChanged =
      previousUserId !== undefined && previousUserId !== nextUserId;

    const shouldCheckCacheMismatch =
      checkCacheMismatch &&
      (event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT");

    const cachedMismatch = shouldCheckCacheMismatch
      ? hasCachedProfileMismatch(nextUserId)
      : false;

    if (import.meta.env.DEV) {
      console.debug("[auth] auth state change", {
        event,
        previousUserId,
        nextUserId,
        userChanged,
        cachedMismatch,
      });
    }

    if (userChanged) {
      clearProfileState();
      clearUserBoundQueries(previousUserId ?? null);
      if (nextUserId !== previousUserId) {
        clearUserBoundQueries(nextUserId);
      }
    }

    if ((event === "SIGNED_OUT" || nextUserId === null) && previousUserId !== undefined) {
      clearProfileState();
    }

    if (userChanged || cachedMismatch) {
      clearUserCache(previousUserId ?? nextUserId);
      if (nextUserId && nextUserId !== previousUserId) {
        clearUserCache(nextUserId);
      }
    }

    if (nextUser) {
      posthog.identify(nextUser.id, {
        email: nextUser.email ?? undefined,
      });
    } else {
      posthog.reset();
    }

    setActiveUserId(nextUserId);
    window.dispatchEvent(
      new CustomEvent(AUTH_USER_CHANGED_EVENT, {
        detail: { userId: nextUserId, previousUserId },
      }),
    );
    previousUserIdRef.current = nextUserId;
    setSession(nextSession);
    setUser(nextUser);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      syncAuthState("INITIAL_SESSION", data.session ?? null, true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      syncAuthState(event, nextSession ?? null, true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    const currentUserId = user?.id ?? previousUserIdRef.current ?? null;

    clearProfileState();
    clearUserBoundQueries(currentUserId);
    clearUserCache(currentUserId);

    try {
      sessionStorage.removeItem("post_login_redirect");
    } catch {
      // ignore
    }

    setLoading(true);

    try {
      await supabase.auth.signOut();
    } finally {
      const previousUserId = previousUserIdRef.current ?? currentUserId ?? null;

      setActiveUserId(null);
      previousUserIdRef.current = null;
      setSession(null);
      setUser(null);
      setLoading(false);
      posthog.reset();

      window.dispatchEvent(
        new CustomEvent(AUTH_USER_CHANGED_EVENT, {
          detail: { userId: null, previousUserId },
        }),
      );

      window.location.replace("/");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id ?? null,
        session,
        authReady: !loading,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}