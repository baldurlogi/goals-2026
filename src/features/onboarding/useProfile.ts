import { useEffect, useState } from "react";
import {
  loadProfile,
  readProfileCache,
  PROFILE_CHANGED_EVENT,
  type UserProfile,
} from "@/features/onboarding/profileStorage";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(readProfileCache);

  useEffect(() => {
    const sync = () => {
      void loadProfile().then(setProfile);
    };

    sync();
    window.addEventListener(PROFILE_CHANGED_EVENT, sync);

    return () => {
      window.removeEventListener(PROFILE_CHANGED_EVENT, sync);
    };
  }, []);

  return profile;
}