import { OnboardingFlow } from "./OnboardingFlow";
import { useProfileQuery } from "@/features/onboarding/useProfileQuery";

type Props = {
  children: React.ReactNode;
};

export function RequireOnboarding({ children }: Props) {
  const { data: profile, isLoading, refetch } = useProfileQuery();

  if (isLoading && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="animate-pulse text-sm text-muted-foreground">Loading your setup…</div>
      </div>
    );
  }

  if (!profile?.onboarding_done) {
    return <OnboardingFlow onComplete={() => void refetch()} />;
  }

  return <>{children}</>;
}
