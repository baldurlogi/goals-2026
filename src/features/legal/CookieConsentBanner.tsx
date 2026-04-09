import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  readCookieConsent,
  subscribeCookieConsent,
  writeCookieConsent,
  type CookieConsentState,
} from "@/features/legal/cookieConsent";

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsentState | null>(() =>
    readCookieConsent(),
  );

  useEffect(() => subscribeCookieConsent(setConsent), []);

  if (consent) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="max-w-3xl space-y-1">
          <p className="text-sm font-semibold">Your privacy choices</p>
          <p className="text-sm text-muted-foreground">
            Begyn uses essential storage for sign-in and app security. We only
            enable product analytics after you say yes, and you can change that
            later in the{" "}
            <Link
              to="/privacy"
              className="font-medium text-violet-500 hover:underline"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setConsent(writeCookieConsent("rejected"));
            }}
          >
            Use essential only
          </Button>
          <Button
            type="button"
            className="bg-violet-600 text-white hover:bg-violet-600/90"
            onClick={() => {
              setConsent(writeCookieConsent("accepted"));
            }}
          >
            Accept analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
