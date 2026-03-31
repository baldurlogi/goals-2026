import { supabase } from "@/lib/supabaseClient";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";
const CANCELLED_ONBOARDING_KEY = "cancelled_onboarding";
export type AuthIntent = "login" | "signup";

export function resolvePostLoginPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/auth")) return null;
  return value;
}

function isPublicAuthPath(path: string): boolean {
  return path === "/" || path === "/login" || path === "/signup";
}

export function resolvePostAuthDestination(...values: unknown[]): string {
  for (const value of values) {
    const path = resolvePostLoginPath(value);
    if (!path || isPublicAuthPath(path)) continue;
    return path;
  }

  return "/app";
}

export function readStoredPostLoginRedirect(): string | null {
  try {
    return resolvePostLoginPath(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY));
  } catch {
    return null;
  }
}

export function clearStoredPostLoginRedirect(): void {
  try {
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  } catch {
    // ignore storage failures
  }
}

export function hasCancelledOnboarding(): boolean {
  try {
    return sessionStorage.getItem(CANCELLED_ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingCancelled(): void {
  try {
    sessionStorage.setItem(CANCELLED_ONBOARDING_KEY, "1");
  } catch {
    // ignore storage failures
  }
}

export function clearCancelledOnboarding(): void {
  try {
    sessionStorage.removeItem(CANCELLED_ONBOARDING_KEY);
  } catch {
    // ignore storage failures
  }
}

export function buildAuthCallbackRedirect(intent: AuthIntent): string {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("intent", intent);

  const nextPath = readStoredPostLoginRedirect();
  if (nextPath) {
    callbackUrl.searchParams.set("next", nextPath);
  }

  return callbackUrl.toString();
}

export async function startGoogleAuth(intent: AuthIntent): Promise<{
  error: Error | null;
  redirectTo: string;
  forcedAccountSelection: boolean;
}> {
  const redirectTo = buildAuthCallbackRedirect(intent);
  const forcedAccountSelection = hasCancelledOnboarding();

  if (forcedAccountSelection) {
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      return {
        error: signOutError,
        redirectTo,
        forcedAccountSelection,
      };
    }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: forcedAccountSelection
        ? { prompt: "select_account" }
        : undefined,
    },
  });

  return {
    error,
    redirectTo,
    forcedAccountSelection,
  };
}
