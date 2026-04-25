import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  confirmLaunchWaitlist,
  LaunchWaitlistError,
} from "@/features/landing/waitlist";

type ConfirmState = "loading" | "success" | "error";

export default function WaitlistConfirmPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ConfirmState>("loading");
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const token = searchParams.get("token") ?? "";
      const email = searchParams.get("email") ?? "";
      const planId = searchParams.get("plan") ?? "pro";

      try {
        const result = await confirmLaunchWaitlist({
          token,
          email,
          planId,
        });

        if (cancelled) return;

        setState("success");
        setMessage(
          result.message ??
            "Your email is confirmed. We'll notify you when Pro launches.",
        );
      } catch (error) {
        if (cancelled) return;

        const nextMessage =
          error instanceof LaunchWaitlistError
            ? error.message
            : "We couldn't confirm that email right now. Please try the waitlist form again.";

        setState("error");
        setMessage(nextMessage);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const title =
    state === "loading"
      ? "Confirming your email"
      : state === "success"
        ? "You're confirmed"
        : "This link needs attention";

  return (
    <div className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6">
      <div className="mx-auto max-w-lg rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              state === "success"
                ? "bg-emerald-500/15 text-emerald-400"
                : state === "error"
                  ? "bg-rose-500/15 text-rose-400"
                  : "bg-violet-500/15 text-violet-400"
            }`}
          >
            {state === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : state === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <MailCheck className="h-5 w-5" />
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Begyn Waitlist
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          </div>
        </div>

        <p className="text-sm leading-7 text-muted-foreground">{message}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="rounded-xl">
            <Link to="/">Back to Begyn</Link>
          </Button>

          {state === "error" && (
            <Button asChild variant="outline" className="rounded-xl">
              <a href="/#pricing">Try the waitlist again</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
