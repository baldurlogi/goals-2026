import { useEffect, useMemo, useState } from "react";
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

type ProfileLoadState = {
  userId: string | null;
  profile: UserProfile | null | undefined;
};

export function RequireOnboarding({ children }: Props) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loadState, setLoadState] = useState<ProfileLoadState>({
    userId,
    profile: undefined,
  });

  const cachedProfile = useMemo(() => {
    if (!userId) return null;
    return readProfileCache(userId);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    if (!userId) return;

    void loadProfile().then((fresh) => {
      if (cancelled) return;
      setLoadState({
        userId,
        profile: fresh ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadedProfile = loadState.userId === userId ? loadState.profile : undefined;
  const profile = userId ? loadedProfile ?? cachedProfile ?? null : null;
  const checking = Boolean(userId) && loadedProfile === undefined && !cachedProfile;

  if (checking) return null;

  if (!profile?.onboarding_done) {
    return (
      <OnboardingFlow
        onComplete={() => {
          void loadProfile().then((fresh) => {
            setLoadState({
              userId,
              profile: fresh ?? null,
            });
          });
        }}
      />
    );
  }

  return <>{children}</>;
}
