import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import {
  loadProfile,
  PROFILE_CHANGED_EVENT,
  readProfileCache,
  type UserProfile,
} from "@/features/onboarding/profileStorage";

export function useProfile() {
  const { userId, authReady } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    readProfileCache(userId),
  );

  useEffect(() => {
    if (!authReady) {
      setProfile(null);
      return;
    }

    if (!userId) {
      setProfile(null);
      return;
    }

    setProfile((current) =>
      current?.id === userId ? current : readProfileCache(userId),
    );

    let cancelled = false;

    const sync = () => {
      void loadProfile().then((next) => {
        if (cancelled) return;

        if (next?.id === userId) {
          setProfile(next);
          return;
        }

        setProfile((current) =>
          current?.id === userId ? current : readProfileCache(userId),
        );
      });
    };

    sync();
    window.addEventListener(PROFILE_CHANGED_EVENT, sync);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_CHANGED_EVENT, sync);
    };
  }, [authReady, userId]);

  return profile;
}
