import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/features/auth/authContext";
import {
  loadProfile,
  readProfileCache,
  type UserProfile,
} from "@/features/onboarding/profileStorage";
import { OnboardingFlow } from "./OnboardingFlow";

type Props = { children: React.ReactNode };

type InnerProps = Props & {
  user: User | null;
};

function RequireOnboardingForUser({ user, children }: InnerProps) {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const cached = readProfileCache();
    if (!user) return null;
    if (cached?.id && cached.id !== user.id) return null;
    return cached;
  });
  const [checking, setChecking] = useState(Boolean(user));
  const userIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    userIdRef.current = currentUserId;

    if (!user) return;

    void loadProfile().then((p) => {
      if (userIdRef.current !== currentUserId) return;
      if (p && p.id !== currentUserId) return;

      setProfile(p);
      setChecking(false);
    });

  if (checking) return null;

  if (!profile?.onboarding_done) {
    return (
      <OnboardingFlow
        onComplete={() => {
          const currentUserId = userIdRef.current;
          if (!currentUserId) return;

          void loadProfile().then((nextProfile) => {
            if (userIdRef.current !== currentUserId) return;
            if (nextProfile && nextProfile.id !== currentUserId) return;
            setProfile(nextProfile);
          });
        }}
      />
    );
  }

  return <>{children}</>;
}

export function RequireOnboarding({ children }: Props) {
  const { user } = useAuth();

  return (
    <RequireOnboardingForUser key={user?.id ?? "anonymous"} user={user}>
      {children}
    </RequireOnboardingForUser>
  );
}
