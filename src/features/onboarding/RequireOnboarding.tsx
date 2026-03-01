import { useEffect, useState } from "react";
import { useAuth } from "@/auth/authContext";
import { loadProfile, readProfileCache, type UserProfile } from "./profileStorage";
import { OnboardingFlow } from "./OnboardingFlow";

type Props = { children: React.ReactNode };

export function RequireOnboarding({ children }: Props) {
  const { user } = useAuth();
  const [profile, setProfile]   = useState<UserProfile | null>(readProfileCache);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => setChecking(false));
      return;
    }

    loadProfile().then((p) => {
      setProfile(p);
      setChecking(false);
    });
  }, [user]);

  // Still checking — show nothing (parent RequireAuth already shows spinner)
  if (checking) return null;

  // Onboarding not done
  if (!profile?.onboarding_done) {
    return (
      <OnboardingFlow
        onComplete={() => {
          // Reload profile from cache after save
          loadProfile().then(setProfile);
        }}
      />
    );
  }

  return <>{children}</>;
}