const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";

export function resolvePostLoginPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/auth")) return null;
  return value;
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

export function buildAuthCallbackRedirect(intent: "login" | "signup"): string {
  const callbackUrl = new URL("/auth/callback", window.location.origin);
  callbackUrl.searchParams.set("intent", intent);

  const nextPath = readStoredPostLoginRedirect();
  if (nextPath) {
    callbackUrl.searchParams.set("next", nextPath);
  }

  return callbackUrl.toString();
}
