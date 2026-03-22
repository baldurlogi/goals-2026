import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { capture } from "@/lib/analytics";
import {
  hasCancelledOnboarding,
  readStoredPostLoginRedirect,
  startGoogleAuth,
} from "./authRedirect";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  async function handleGoogle() {
    if (!agreed) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    setError(null);
    setLoading(true);
    const resumedAfterCancel = hasCancelledOnboarding();

    capture("signup_started", {
      method: "google",
      source: "signup_page",
      route: "/signup",
      resumed_after_onboarding_cancel: resumedAfterCancel,
    });

    const { error, redirectTo, forcedAccountSelection } = await startGoogleAuth("signup");

    if (import.meta.env.DEV) {
      console.debug("[auth] starting signup", {
        redirectTo,
        storedNext: readStoredPostLoginRedirect(),
        forcedAccountSelection,
      });
    }

    if (error) {
      capture("signup_failed", {
        method: "google",
        source: "signup_page",
        route: "/signup",
        resumed_after_onboarding_cancel: resumedAfterCancel,
        forced_account_selection: forcedAccountSelection,
        error_message: error.message,
      });

      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4">
      <Link to="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to home
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 text-4xl">📊</div>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Start tracking your goals, habits, fitness and daily progress.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  if (error) setError(null);
                }}
                className="sr-only"
              />
              <div
                className={cn(
                  "h-4 w-4 rounded border transition-colors flex items-center justify-center",
                  agreed
                    ? "bg-violet-500 border-violet-500"
                    : "border-border bg-muted/40 group-hover:border-violet-500/50",
                )}
              >
                {agreed && (
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1.5 5L4 7.5L8.5 2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>

            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to Begyn&apos;s{" "}
              <Link
                to="/terms"
                className="text-violet-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                to="/privacy"
                className="text-violet-400 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
              , including the processing of my personal data as described therein.
            </span>
          </label>

          <Button
            className="w-full gap-3"
            variant="outline"
            onClick={handleGoogle}
            disabled={loading}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? "Redirecting…" : "Continue with Google"}
          </Button>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
              {error}
            </p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-violet-400 hover:underline">
              Log in
            </Link>
          </p>

          <p className="text-center text-[11px] text-muted-foreground">
            Your data is private and only visible to you.
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
