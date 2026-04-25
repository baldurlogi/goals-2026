import { getSupabaseFunctionUrl } from "@/lib/supabaseClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_FN_URL = getSupabaseFunctionUrl("waitlist");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export class LaunchWaitlistError extends Error {
  code:
    | "invalid_email"
    | "save_failed"
    | "rate_limited"
    | "invalid_link"
    | "expired_link"
    | "service_unavailable";

  constructor(
    code:
      | "invalid_email"
      | "save_failed"
      | "rate_limited"
      | "invalid_link"
      | "expired_link"
      | "service_unavailable",
    message: string,
  ) {
    super(message);
    this.name = "LaunchWaitlistError";
    this.code = code;
  }
}

type JoinLaunchWaitlistInput = {
  email: string;
  planId: string;
  source?: string;
};

type ConfirmLaunchWaitlistInput = {
  email: string;
  planId: string;
  token: string;
};

type WaitlistResponse = {
  ok?: boolean;
  status?: string;
  message?: string;
  error?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function postWaitlistAction(
  body: Record<string, unknown>,
): Promise<WaitlistResponse> {
  let response: Response;

  try {
    response = await fetch(WAITLIST_FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SUPABASE_ANON_KEY
          ? {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            }
          : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new LaunchWaitlistError(
      "service_unavailable",
      "The waitlist service isn't reachable right now. Please try again shortly.",
    );
  }

  const data = (await response.json().catch(() => ({}))) as WaitlistResponse;

  if (!response.ok) {
    if (response.status === 401) {
      throw new LaunchWaitlistError(
        "service_unavailable",
        "The waitlist service rejected the request. Make sure the site is using the latest build and the Supabase anon key is available.",
      );
    }

    if (response.status === 404) {
      throw new LaunchWaitlistError(
        "service_unavailable",
        "The waitlist service isn't live yet. Deploy the waitlist function and try again.",
      );
    }

    if (response.status === 503) {
      throw new LaunchWaitlistError(
        "service_unavailable",
        typeof data.error === "string" && data.error.trim()
          ? data.error
          : "The waitlist email service isn't available right now. Please try again shortly.",
      );
    }

    const message =
      typeof data.error === "string" && data.error.trim()
        ? data.error
        : "Couldn't complete your waitlist request right now.";

    if (response.status === 429) {
      throw new LaunchWaitlistError("rate_limited", message);
    }

    if (message.toLowerCase().includes("expired")) {
      throw new LaunchWaitlistError("expired_link", message);
    }

    if (
      message.toLowerCase().includes("invalid") ||
      message.toLowerCase().includes("couldn't find")
    ) {
      throw new LaunchWaitlistError("invalid_link", message);
    }

    throw new LaunchWaitlistError("save_failed", message);
  }

  return data;
}

export async function joinLaunchWaitlist({
  email,
  planId,
  source = "landing_pricing",
}: JoinLaunchWaitlistInput): Promise<WaitlistResponse> {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new LaunchWaitlistError(
      "invalid_email",
      "Enter a valid email address to join the waitlist.",
    );
  }

  return postWaitlistAction({
    action: "signup",
    email: normalizedEmail,
    planId,
    source,
  });
}

export async function confirmLaunchWaitlist({
  email,
  planId,
  token,
}: ConfirmLaunchWaitlistInput): Promise<WaitlistResponse> {
  const normalizedEmail = normalizeEmail(email);

  if (!EMAIL_REGEX.test(normalizedEmail) || token.trim().length < 32) {
    throw new LaunchWaitlistError(
      "invalid_link",
      "That confirmation link is invalid. Request a new one from the waitlist form.",
    );
  }

  return postWaitlistAction({
    action: "confirm",
    email: normalizedEmail,
    planId,
    token: token.trim(),
  });
}
