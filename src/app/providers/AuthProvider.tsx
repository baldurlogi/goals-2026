import { useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import posthog from "posthog-js";

import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/features/auth/authContext";
import { clearUserCache } from "@/lib/clearUserCache";

function hasCachedProfileMismatch(nextUserId: string | null): boolean {
  try {
    const legacyRaw = localStorage.getItem("cache:profile:v1");
    if (legacyRaw) {
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

      if (key.startsWith("cache:profile:v2:")) {
        const cachedUserId = key.replace("cache:profile:v2:", "");
        if (nextUserId === null || cachedUserId !== nextUserId) {
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
    nextSession: Session | null,
    checkCacheMismatch = false,
  ) {
    const nextUser = nextSession?.user ?? null;
    const nextUserId = nextUser?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    const userChanged =
      previousUserId !== undefined && previousUserId !== nextUserId;

    const cachedMismatch = checkCacheMismatch
      ? hasCachedProfileMismatch(nextUserId)
      : false;

    if (userChanged || cachedMismatch) {
      clearUserCache();
    }

    if (nextUser) {
      posthog.identify(nextUser.id, {
        email: nextUser.email ?? undefined,
      });
    } else {
      posthog.reset();
    }

    previousUserIdRef.current = nextUserId;
    setSession(nextSession);
    setUser(nextUser);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      syncAuthState(data.session ?? null, true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      syncAuthState(nextSession ?? null, true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    clearUserCache();
    posthog.reset();
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