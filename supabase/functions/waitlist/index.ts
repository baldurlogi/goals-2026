import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const CONFIRMATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type WaitlistAction = "signup" | "confirm";

type SignupBody = {
  action: "signup";
  email?: string;
  planId?: string;
  source?: string;
};

type ConfirmBody = {
  action: "confirm";
  email?: string;
  planId?: string;
  token?: string;
};

type WaitlistBody = SignupBody | ConfirmBody;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePlanId(planId?: string | null): string {
  const normalized = planId?.trim().toLowerCase();
  return normalized || "pro";
}

function normalizeSource(source?: string | null): string {
  const normalized = source?.trim().toLowerCase();
  return normalized || "landing_pricing";
}

function getClientIp(req: Request): string | null {
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ];

  return candidates.find((value) => typeof value === "string" && value.length > 0) ?? null;
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function makeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role credentials.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function buildConfirmationLink(req: Request, token: string, email: string, planId: string): string {
  const baseUrl =
    Deno.env.get("WAITLIST_CONFIRM_BASE_URL") ??
    req.headers.get("origin") ??
    "http://localhost:5173";

  const url = new URL("/waitlist/confirm", baseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("email", email);
  url.searchParams.set("plan", planId);
  return url.toString();
}

async function sendConfirmationEmail(
  email: string,
  confirmationLink: string,
  planId: string,
) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail =
    Deno.env.get("WAITLIST_FROM_EMAIL") ?? "Begyn <hello@begyn.app>";

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  const planLabel = planId === "pro" ? "Pro" : planId.toUpperCase();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [email],
      subject: `Confirm your Begyn ${planLabel} waitlist spot`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">Confirm your Begyn ${planLabel} waitlist spot</h2>
          <p style="margin-bottom: 12px;">
            Click the button below to confirm that this email belongs to you.
          </p>
          <p style="margin-bottom: 20px;">
            You will only be notified when ${planLabel} launches. If you did not request this, you can ignore this email.
          </p>
          <p style="margin-bottom: 20px;">
            <a
              href="${confirmationLink}"
              style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #8b5cf6; color: #ffffff; text-decoration: none; font-weight: 600;"
            >
              Confirm email
            </a>
          </p>
          <p style="font-size: 13px; color: #6b7280;">
            This link expires in 7 days.
          </p>
          <p style="font-size: 13px; color: #6b7280; word-break: break-all;">
            ${confirmationLink}
          </p>
        </div>
      `,
      text: [
        `Confirm your Begyn ${planLabel} waitlist spot.`,
        "",
        "Open this link to confirm your email:",
        confirmationLink,
        "",
        "This link expires in 7 days.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error: ${errorText}`);
  }
}

async function handleSignup(req: Request, body: SignupBody) {
  const email = body.email ? normalizeEmail(body.email) : "";
  const planId = normalizePlanId(body.planId);
  const source = normalizeSource(body.source);

  if (!EMAIL_REGEX.test(email)) {
    return jsonResponse(400, {
      error: "Enter a valid email address to join the waitlist.",
    });
  }

  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  if (!clientIp) {
    return jsonResponse(400, {
      error: "Couldn't verify your request. Please try again.",
    });
  }

  const admin = getAdminClient();
  const ipHash = await sha256(clientIp);
  const windowStartIso = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count: recentAttemptCount, error: attemptsError } = await admin
    .from("launch_waitlist_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", windowStartIso);

  if (attemptsError) {
    console.error("waitlist attempt lookup failed", attemptsError);
    return jsonResponse(500, { error: "Couldn't process your signup right now." });
  }

  if ((recentAttemptCount ?? 0) >= RATE_LIMIT_ATTEMPTS) {
    return jsonResponse(429, {
      error: "Too many signup attempts from this connection. Please try again in a bit.",
    });
  }

  const { error: logAttemptError } = await admin.from("launch_waitlist_attempts").insert({
    ip_hash: ipHash,
    source,
  });

  if (logAttemptError) {
    console.error("waitlist attempt insert failed", logAttemptError);
  }

  const { data: existingEntry, error: existingError } = await admin
    .from("launch_waitlist")
    .select("id, confirmed_at")
    .eq("email_normalized", email)
    .eq("plan_id", planId)
    .maybeSingle();

  if (existingError) {
    console.error("waitlist existing lookup failed", existingError);
    return jsonResponse(500, { error: "Couldn't process your signup right now." });
  }

  if (existingEntry?.confirmed_at) {
    return jsonResponse(200, {
      ok: true,
      status: "already_confirmed",
      message: "This email is already confirmed for the waitlist.",
    });
  }

  const token = makeToken();
  const tokenHash = await sha256(token);
  const confirmationLink = buildConfirmationLink(req, token, email, planId);
  const nowIso = new Date().toISOString();

  const payload = {
    email,
    email_normalized: email,
    plan_id: planId,
    source,
    confirmed_at: null,
    confirmation_token_hash: tokenHash,
    confirmation_sent_at: nowIso,
    last_ip_hash: ipHash,
    last_user_agent: userAgent,
  };

  const writeQuery = existingEntry
    ? admin
        .from("launch_waitlist")
        .update(payload)
        .eq("id", existingEntry.id)
    : admin
        .from("launch_waitlist")
        .insert(payload);

  const { error: writeError } = await writeQuery;

  if (writeError) {
    console.error("waitlist write failed", writeError);
    return jsonResponse(500, { error: "Couldn't save your signup right now." });
  }

  try {
    await sendConfirmationEmail(email, confirmationLink, planId);
  } catch (error) {
    console.error("waitlist email send failed", error);
    return jsonResponse(503, {
      error: "Couldn't send the confirmation email right now. Please try again shortly.",
    });
  }

  return jsonResponse(200, {
    ok: true,
    status: "confirmation_sent",
    message: "Check your inbox and confirm your email to join the waitlist.",
  });
}

async function handleConfirm(body: ConfirmBody) {
  const email = body.email ? normalizeEmail(body.email) : "";
  const planId = normalizePlanId(body.planId);
  const token = body.token?.trim() ?? "";

  if (!EMAIL_REGEX.test(email) || token.length < 32) {
    return jsonResponse(400, {
      error: "That confirmation link is invalid. Request a new one from the waitlist form.",
    });
  }

  const admin = getAdminClient();
  const { data: entry, error: entryError } = await admin
    .from("launch_waitlist")
    .select("id, confirmed_at, confirmation_token_hash, confirmation_sent_at")
    .eq("email_normalized", email)
    .eq("plan_id", planId)
    .maybeSingle();

  if (entryError) {
    console.error("waitlist confirmation lookup failed", entryError);
    return jsonResponse(500, { error: "Couldn't verify that confirmation link right now." });
  }

  if (!entry) {
    return jsonResponse(404, {
      error: "We couldn't find a matching waitlist signup. Try signing up again.",
    });
  }

  if (entry.confirmed_at) {
    return jsonResponse(200, {
      ok: true,
      status: "already_confirmed",
      message: "Your email is already confirmed for the waitlist.",
    });
  }

  if (!entry.confirmation_token_hash || !entry.confirmation_sent_at) {
    return jsonResponse(400, {
      error: "That confirmation link is no longer valid. Request a new one from the waitlist form.",
    });
  }

  const sentAt = new Date(entry.confirmation_sent_at).getTime();
  if (!Number.isFinite(sentAt) || Date.now() - sentAt > CONFIRMATION_WINDOW_MS) {
    return jsonResponse(400, {
      error: "That confirmation link has expired. Request a new one from the waitlist form.",
    });
  }

  const tokenHash = await sha256(token);
  if (tokenHash !== entry.confirmation_token_hash) {
    return jsonResponse(400, {
      error: "That confirmation link is invalid. Request a new one from the waitlist form.",
    });
  }

  const { error: confirmError } = await admin
    .from("launch_waitlist")
    .update({
      confirmed_at: new Date().toISOString(),
      confirmation_token_hash: null,
    })
    .eq("id", entry.id);

  if (confirmError) {
    console.error("waitlist confirmation update failed", confirmError);
    return jsonResponse(500, { error: "Couldn't confirm your email right now." });
  }

  return jsonResponse(200, {
    ok: true,
    status: "confirmed",
    message: "Your email is confirmed. We'll notify you when Pro launches.",
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  let body: WaitlistBody;
  try {
    body = (await req.json()) as WaitlistBody;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const action = body.action as WaitlistAction | undefined;

  try {
    if (action === "signup") {
      return await handleSignup(req, body as SignupBody);
    }

    if (action === "confirm") {
      return await handleConfirm(body as ConfirmBody);
    }
  } catch (error) {
    console.error("waitlist function error", error);
    return jsonResponse(500, { error: "Unexpected waitlist error." });
  }

  return jsonResponse(400, { error: "Unsupported waitlist action." });
});
