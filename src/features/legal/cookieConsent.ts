export type CookieConsentChoice = "accepted" | "rejected";

export type CookieConsentState = {
  analytics: boolean;
  choice: CookieConsentChoice;
  updatedAt: string;
  version: number;
};

const COOKIE_CONSENT_STORAGE_KEY = "legal:cookie-consent:v1";
const COOKIE_CONSENT_EVENT = "begyn:cookie-consent-changed";
const COOKIE_CONSENT_VERSION = 1;

function isBrowser() {
  return typeof window !== "undefined";
}

export function getCookieConsentStorageKey() {
  return COOKIE_CONSENT_STORAGE_KEY;
}

export function getCookieConsentEventName() {
  return COOKIE_CONSENT_EVENT;
}

export function readCookieConsent(): CookieConsentState | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CookieConsentState> | null;
    if (!parsed || typeof parsed !== "object") return null;

    const choice =
      parsed.choice === "accepted" || parsed.choice === "rejected"
        ? parsed.choice
        : null;

    if (!choice || typeof parsed.updatedAt !== "string") {
      return null;
    }

    return {
      analytics: choice === "accepted",
      choice,
      updatedAt: parsed.updatedAt,
      version:
        typeof parsed.version === "number"
          ? parsed.version
          : COOKIE_CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return readCookieConsent()?.analytics === true;
}

export function hasCookieConsentChoice(): boolean {
  return readCookieConsent() !== null;
}

export function writeCookieConsent(choice: CookieConsentChoice): CookieConsentState {
  const nextState: CookieConsentState = {
    analytics: choice === "accepted",
    choice,
    updatedAt: new Date().toISOString(),
    version: COOKIE_CONSENT_VERSION,
  };

  if (!isBrowser()) {
    return nextState;
  }

  try {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify(nextState),
    );
  } catch {
    // ignore storage failures
  }

  try {
    window.dispatchEvent(
      new CustomEvent<CookieConsentState>(COOKIE_CONSENT_EVENT, {
        detail: nextState,
      }),
    );
  } catch {
    // ignore event failures
  }

  return nextState;
}

export function subscribeCookieConsent(
  listener: (state: CookieConsentState | null) => void,
): () => void {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleCustomEvent = (
    event: Event,
  ) => {
    const customEvent = event as CustomEvent<CookieConsentState | undefined>;
    listener(customEvent.detail ?? readCookieConsent());
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== COOKIE_CONSENT_STORAGE_KEY) return;
    listener(readCookieConsent());
  };

  window.addEventListener(COOKIE_CONSENT_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
