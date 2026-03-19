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
        description="Your saved profile is still loading. If this takes a moment, we'll keep waiting."
        status="loading"
      />
    );
  }

  if (error) {
    return (
      <ProfileStateCard
        title="We couldn't load your setup"
        description="This usually means the profile request hit a temporary error. Retry to continue."
        status="error"
        actionLabel="Retry"
        onAction={() => void refetch()}
        busy={isFetching}
      />
    );
  }

  if (!profile || !profile.onboarding_done) {
    return <OnboardingFlow onComplete={() => void refetch()} />;
  }

  return <>{children}</>;
}