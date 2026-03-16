import { useEffect, useState } from "react";
import {
  loadProfile,
  PROFILE_CHANGED_EVENT,
  type UserProfile,
} from "@/features/onboarding/profileStorage";

function readAnyProfileCache(): UserProfile | null {
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("cache:profile:v2:")) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as UserProfile;
      if (parsed?.id) return parsed;
    }

    const legacyRaw = localStorage.getItem("cache:profile:v1");
    if (!legacyRaw) return null;

    const legacy = JSON.parse(legacyRaw) as UserProfile;
    return legacy?.id ? legacy : null;
  } catch {
    return null;
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    readAnyProfileCache(),
  );

  useEffect(() => {
    let cancelled = false;

    const sync = () => {
      void loadProfile().then((next) => {
        if (cancelled) return;

        if (next) {
          setProfile(next);
          return;
        }

        setProfile((current) => current ?? readAnyProfileCache());
      });
    };

    sync();
    window.addEventListener(PROFILE_CHANGED_EVENT, sync);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_CHANGED_EVENT, sync);
    };
  }, []);

  return profile;
}