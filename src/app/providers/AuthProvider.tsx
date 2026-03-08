import { useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/features/auth/authContext";
import { clearUserCache } from "@/lib/clearUserCache";

function getCachedProfileUserId(): string | null {
  try {
    const raw = localStorage.getItem("cache:profile:v1");
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { id?: unknown };
    return typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const previousUserIdRef = useRef<string | null | undefined>(undefined);

  function syncAuthState(nextSession: Session | null, checkCacheMismatch = false) {
    const nextUser = nextSession?.user ?? null;
    const nextUserId = nextUser?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    const userChanged =
      previousUserId !== undefined && previousUserId !== nextUserId;

    const cachedProfileUserId = checkCacheMismatch ? getCachedProfileUserId() : null;

    const cachedMismatch =
      checkCacheMismatch &&
      ((nextUserId === null && cachedProfileUserId !== null) ||
        (nextUserId !== null &&
          cachedProfileUserId !== null &&
          cachedProfileUserId !== nextUserId));

    if (userChanged || cachedMismatch) {
      clearUserCache();
    }

    previousUserIdRef.current = nextUserId;
    setSession(nextSession);
    setUser(nextUser);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
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
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}