import { ProfileStateCard } from "./components/ProfileStateCard";
import { OnboardingFlow } from "./OnboardingFlow";
import { useProfileState } from "@/features/onboarding/useProfileQuery";


type Props = {
  children: React.ReactNode;
};

export function RequireOnboarding({ children }: Props) {
  const {
    profile,
    isAuthLoading,
    isProfileLoading,
    isMissingProfile,
    error,
    isFetching,
    refetch,
  } = useProfileState();

  if (isAuthLoading) {
    return (
      <ProfileStateCard
        title="Checking your account"
        description="We're confirming your session before deciding whether to open onboarding or your dashboard."
        status="loading"
      />
    );
  }

  if (isProfileLoading) {
    return (
      <ProfileStateCard
        title="Loading your setup"
        description="Your saved profile is still loading. If this takes a moment, we'll keep waiting instead of treating it like missing data."
        status="loading"
      />
    );
  }

  if (error) {
    return (
      <ProfileStateCard
        title="We couldn't load your setup"
        description="This usually means the profile request timed out or hit a temporary error. Retry to keep your existing onboarding state intact."
        status="error"
        actionLabel="Retry"
        onAction={() => void refetch()}
        busy={isFetching}
      />
    );
  }

  if (isMissingProfile) {
    return (
      <ProfileStateCard
        title="We couldn't find a saved profile yet"
        description="We'll open onboarding so you can finish your setup. If you expected an existing profile, you can retry first."
        status="empty"
        actionLabel="Retry lookup"
        onAction={() => void refetch()}
        busy={isFetching}
      />
    );
  }

  if (!profile?.onboarding_done) {
    return <OnboardingFlow onComplete={() => void refetch()} />;
  }

  return <>{children}</>;
}
