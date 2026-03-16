import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/authContext";
import {
  loadProfile,
  readProfileCache,
  type UserProfile,
} from "@/features/onboarding/profileStorage";
import { OnboardingFlow } from "./OnboardingFlow";

type Props = {
  children: React.ReactNode;
};

export function RequireOnboarding({ children }: Props) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setProfile(null);
      setChecking(false);
      return;
    }

    const cached = readProfileCache(userId);

    if (cached) {
      setProfile(cached);
      setChecking(false);
    } else {
      setChecking(true);
    }

    void loadProfile().then((fresh) => {
      if (cancelled) return;
      setProfile(fresh ?? cached ?? null);
      setChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (checking) return null;

  if (!profile?.onboarding_done) {
    return (
      <OnboardingFlow
        onComplete={() => {
          void loadProfile().then((fresh) => {
            setProfile(fresh);
            setChecking(false);
          });
        }}
      />
    );
  }

  return <>{children}</>;
}