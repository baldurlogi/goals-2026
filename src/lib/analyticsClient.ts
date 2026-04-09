import posthog from "posthog-js";

import { hasAnalyticsConsent } from "@/features/legal/cookieConsent";

const posthogKey =
  import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN ??
  import.meta.env.VITE_PUBLIC_POSTHOG_KEY;

let posthogInitialized = false;

function getPosthogHost() {
  return import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
}

export function getPosthogClient() {
  return posthog;
}

export function isPosthogConfigured() {
  return Boolean(posthogKey);
}

export function ensureAnalyticsInitialized(): boolean {
  if (!isPosthogConfigured()) {
    if (import.meta.env.DEV) {
      console.warn(
        "[analytics] PostHog disabled: missing VITE_PUBLIC_POSTHOG_TOKEN/KEY",
      );
    }
    return false;
  }

  if (posthogInitialized) {
    return true;
  }

  posthog.init(posthogKey!, {
    api_host: getPosthogHost(),
    defaults: "2026-01-30",
    capture_pageview: true,
    capture_pageleave: true,
  });
  posthogInitialized = true;
  return true;
}

export function syncAnalyticsConsent(consented: boolean): void {
  if (!consented) {
    if (posthogInitialized) {
      try {
        posthog.opt_out_capturing();
        posthog.reset();
      } catch {
        // ignore
      }
    }
    return;
  }

  if (!ensureAnalyticsInitialized()) return;

  try {
    posthog.opt_in_capturing();
  } catch {
    // ignore
  }
}

export function syncAnalyticsIdentity(
  user: { id: string; email?: string | null } | null,
): void {
  if (!hasAnalyticsConsent()) {
    syncAnalyticsConsent(false);
    return;
  }

  if (!ensureAnalyticsInitialized()) return;

  try {
    posthog.opt_in_capturing();
    if (user) {
      posthog.identify(user.id, {
        email: user.email ?? undefined,
      });
    } else {
      posthog.reset();
    }
  } catch {
    // ignore analytics failures
  }
}
