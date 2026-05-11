// supabase/functions/stripe-webhook/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Maps Stripe Price ID → Kairo tier
const PRICE_TO_TIER: Record<string, string> = {
  "price_1T97kML2QuV5S23H5vzPnMx8": "pro",      // Pro monthly
  "price_1T97p8L2QuV5S23HZ5BSFiD7": "pro",      // Pro yearly
  "price_1T97lYL2QuV5S23HFRR6C4hJ": "pro_max",  // Pro Max monthly
  "price_1T97oZL2QuV5S23He7ukHrFc": "pro_max",  // Pro Max yearly
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeKey       = Deno.env.get("STRIPE_SECRET_KEY")!;
  const webhookSecret   = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabase        = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  // ── Verify webhook signature (skip if no secret set — dev only) ───────
  if (webhookSecret) {
    // Manual HMAC verification — no Stripe SDK available in Deno edge
    const parts     = signature.split(",").reduce((acc, part) => {
      const [key, val] = part.split("=");
      acc[key] = val;
      return acc;
    }, {} as Record<string, string>);

    const timestamp  = parts["t"];
    const sigV1      = parts["v1"];
    const payload    = `${timestamp}.${body}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const hex = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (hex !== sigV1) {
      return new Response("Webhook signature verification failed", { status: 400 });
    }
  }

  const event = JSON.parse(body);

  // ── Handle events ─────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // Payment succeeded — upgrade tier
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;

        const customerId     = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId         = session.metadata?.supabase_user_id as string | undefined;

        // Get subscription to find price
        const subRes  = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { "Authorization": `Bearer ${stripeKey}` },
        });
        const sub     = await subRes.json();
        const priceId = sub.items?.data?.[0]?.price?.id as string;
        const tier    = PRICE_TO_TIER[priceId] ?? "pro";

        if (userId) {
          await supabase.from("profiles").update({
            tier,
            stripe_customer_id:    customerId,
            stripe_subscription_id: subscriptionId,
          }).eq("id", userId);
        } else {
          // Fallback: look up by customer ID
          await supabase.from("profiles").update({
            tier,
            stripe_subscription_id: subscriptionId,
          }).eq("stripe_customer_id", customerId);
        }
        break;
      }

      // Subscription updated (plan change)
      case "customer.subscription.updated": {
        const sub     = event.data.object;
        const priceId = sub.items?.data?.[0]?.price?.id as string;
        const tier    = PRICE_TO_TIER[priceId] ?? "pro";
        const status  = sub.status as string;

        // Only update tier if subscription is active
        if (status === "active" || status === "trialing") {
          await supabase.from("profiles")
            .update({ tier, stripe_subscription_id: sub.id })
            .eq("stripe_customer_id", sub.customer);
        }
        break;
      }

      // Subscription cancelled / payment failed — downgrade to free
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await supabase.from("profiles")
          .update({ tier: "free", stripe_subscription_id: null })
          .eq("stripe_customer_id", sub.customer);
        break;
      }

      // Payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn("Payment failed for customer:", invoice.customer);
        // Optionally: send email, set a grace period flag, etc.
        // For now just log — don't downgrade immediately on first failure
        break;
      }

      default:
        console.log("Unhandled Stripe event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Webhook handler error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Handler error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});