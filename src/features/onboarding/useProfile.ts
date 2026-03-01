import { useEffect, useState } from "react";
import { loadProfile, readProfileCache, type UserProfile } from "./profileStorage";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(readProfileCache);

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  return profile;
}