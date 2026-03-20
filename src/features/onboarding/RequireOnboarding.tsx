import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, RefreshCw } from "lucide-react";
import { ProfileStateCard } from "./components/ProfileStateCard";
import { OnboardingFlow } from "./OnboardingFlow";
import { useProfileState } from "@/features/onboarding/useProfileQuery";
import { useAuth } from "@/features/auth/authContext";
import {
  clearCancelledOnboarding,
  clearStoredPostLoginRedirect,
  markOnboardingCancelled,
} from "@/features/auth/authRedirect";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { capture } from "@/lib/analytics";

type Props = {
  children: React.ReactNode;
};

export function RequireOnboarding({ children }: Props) {
  const navigate = useNavigate();
  const { user, userId, signOut } = useAuth();
  const {
    profile,
    isMissingProfile,
    isAuthLoading,
    isProfileLoading,
    error,
    isFetching,
    refetch,
  } = useProfileState();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (profile?.onboarding_done) {
      clearCancelledOnboarding();
    }
  }, [profile?.onboarding_done]);

  function handleCancelOnboarding() {
    capture("onboarding_cancelled", {
      source:
        showOnboarding || isMissingProfile
          ? "onboarding_flow"
          : "onboarding_gate",
      route: "/app",
    });
    clearStoredPostLoginRedirect();
    markOnboardingCancelled();
    setShowOnboarding(false);
    navigate("/", { replace: true });
  }

  async function handleUseAnotherAccount() {
    try {
      setSigningOut(true);
      clearStoredPostLoginRedirect();
      clearCancelledOnboarding();
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

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

  if (isMissingProfile) {
    return (
      <OnboardingFlow
        onComplete={() => {
          clearCancelledOnboarding();
          void refetch();
        }}
        onCancel={handleCancelOnboarding}
      />
    );
  }


  if (!profile || !profile.onboarding_done) {
    if (!showOnboarding) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl rounded-2xl border border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
                  ✨
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Finish onboarding to open your dashboard
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    This account is signed in, but setup is not finished yet. You can continue onboarding now,
                    or sign out and choose a different account.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <div className="font-medium text-foreground">Signed in as</div>
                <div className="mt-1 break-all text-muted-foreground">
                  {user?.email ?? "Unknown email"}
                </div>
                {import.meta.env.DEV && (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground/70">
                    <div>userId: {userId ?? "none"}</div>
                    <div>profile.id: {profile?.id ?? "none"}</div>
                    <div>onboarding_done: {String(profile?.onboarding_done ?? false)}</div>
                  </div>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelOnboarding}
                  disabled={signingOut}
                >
                  Back for now
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseAnotherAccount}
                  disabled={signingOut}
                  className="gap-2"
                >
                  {signingOut ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Signing out…
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      Use another account
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={() => setShowOnboarding(true)}
                  className="gap-2"
                >
                  Continue onboarding
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                This prevents you from getting trapped in onboarding when the wrong Google account was selected.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <OnboardingFlow
        onComplete={() => {
          clearCancelledOnboarding();
          void refetch();
        }}
        onCancel={handleCancelOnboarding}
      />
    );
  }

  return <>{children}</>;
}
