import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRICE_IDS = {
  pro_monthly: "price_1T97kML2QuV5S23H5vzPnMx8",
  pro_yearly: "price_1T97p8L2QuV5S23HZ5BSFiD7",
  pro_max_monthly: "price_1T97lYL2QuV5S23HFRR6C4hJ",
  pro_max_yearly: "price_1T97oZL2QuV5S23He7ukHrFc",
} as const;

type PriceKey = keyof typeof PRICE_IDS;

type CheckoutBody = {
  priceKey: PriceKey;
  successUrl: string;
  cancelUrl: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader =
      req.headers.get("Authorization") ?? req.headers.get("authorization");

    console.log("checkout: has auth header =", Boolean(authHeader));

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SB_PUBLISHABLE_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: "Missing SUPABASE_URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!supabaseAnonKey) {
      return new Response(
        JSON.stringify({
          error: "Missing SUPABASE_ANON_KEY or SB_PUBLISHABLE_KEY",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("checkout: has stripe key =", Boolean(stripeKey));

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user ?? null;

    console.log("checkout: user error =", userError?.message ?? null);
    console.log("checkout: user id =", user?.id ?? null);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: userError?.message ?? "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = (await req.json()) as CheckoutBody;
    const { priceKey, successUrl, cancelUrl } = body;

    console.log("checkout: priceKey =", priceKey);

    if (!successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "Missing successUrl or cancelUrl" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const priceId = PRICE_IDS[priceKey];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `Invalid priceKey: ${priceKey}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("stripe_customer_id, tier")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.log("checkout: profile error =", profileError.message);
    }

    let customerId: string | undefined = profile?.stripe_customer_id;

    if (!customerId) {
      const customerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: user.email ?? "",
          "metadata[supabase_user_id]": user.id,
        }),
      });

      const customer = await customerRes.json();

      console.log("checkout: stripe customer status =", customerRes.status);
      console.log("checkout: stripe customer body =", customer);

      if (!customerRes.ok) {
        return new Response(
          JSON.stringify({
            error: customer?.error?.message ?? "Failed to create Stripe customer",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      customerId = customer.id;

      const { error: updateError } = await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      if (updateError) {
        console.log("checkout: profile update error =", updateError.message);
      }
    }

    const params = new URLSearchParams({
      mode: "subscription",
      customer: customerId!,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: "true",
      billing_address_collection: "auto",
      "subscription_data[metadata][supabase_user_id]": user.id,
    });

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session = await sessionRes.json();

    console.log("checkout: stripe session status =", sessionRes.status);
    console.log("checkout: stripe session body =", session);

    if (!sessionRes.ok) {
      return new Response(
        JSON.stringify({ error: session?.error?.message ?? "Stripe error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.log("checkout: catch error =", err);

    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});