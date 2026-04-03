import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SubscribeSchema = z.object({
  phone_number: z.string().min(10).max(15),
  carrier_type: z.enum(["EcoCash", "InnBucks", "OneMoney", "Telecash"]),
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getRequiredEnv(name: string): string | null {
  const val = Deno.env.get(name);
  if (!val) console.error(`[contipay-subscribe] Missing env: ${name}`);
  return val || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate all required env vars upfront
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("[contipay-subscribe] Environment check failed", {
        hasUrl: !!supabaseUrl,
        hasAnon: !!anonKey,
        hasServiceRole: !!serviceRoleKey,
      });
      return jsonResponse({ error: "Server misconfiguration" }, 500);
    }

    console.log("[contipay-subscribe] Env vars validated OK");

    // Auth: extract token
    const authHeader =
      req.headers.get("authorization") ?? req.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[contipay-subscribe] No valid auth header present");
      return jsonResponse({ error: "Unauthorized – missing auth token" }, 401);
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");

    // Parse body
    const parsed = SubscribeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse(
        { error: parsed.error.flatten().fieldErrors },
        400,
      );
    }

    // Create admin client (service role) for DB operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Validate user via service role getUser
    const { data: userData, error: userError } =
      await adminClient.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error("[contipay-subscribe] Auth validation failed", {
        error: userError?.message ?? "No user returned",
      });
      return jsonResponse({ error: "Unauthorized – invalid session" }, 401);
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email ?? "";

    console.log("[contipay-subscribe] User authenticated:", userId.slice(0, 8));

    const { phone_number, carrier_type } = parsed.data;

    // Check existing active subscription
    const { data: existingSub, error: existingSubError } = await adminClient
      .from("driver_subscriptions")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingSubError) {
      console.error("Failed checking existing subscription", existingSubError);
      return jsonResponse({ error: "Unable to verify subscription status" }, 500);
    }

    if (existingSub) {
      return jsonResponse(
        {
          error: "You already have an active subscription",
          expires_at: existingSub.expires_at,
        },
        400,
      );
    }

    // ContiPay integration
    const merchantCodes: Record<string, string> = {
      EcoCash: "EC",
      InnBucks: "IB",
      OneMoney: "OM",
      Telecash: "TC",
    };

    const apiKey = getRequiredEnv("CONTIPAY_API_KEY");
    const apiSecret = getRequiredEnv("CONTIPAY_API_SECRET");

    if (!apiKey || !apiSecret) {
      return jsonResponse({ error: "Payment service is not configured" }, 500);
    }

    const credentials = btoa(`${apiKey}:${apiSecret}`);
    const webhookUrl = `${supabaseUrl}/functions/v1/contipay-webhook`;

    const contiPayload = {
      merchantCode: merchantCodes[carrier_type] || "EC",
      currency: "USD",
      amount: 35.0,
      customerPhone: phone_number,
      customerEmail: userEmail,
      description: "Hauliq Driver Monthly Subscription",
      reference: `HAULIQ-SUB-${userId.slice(0, 8)}-${Date.now()}`,
      callbackUrl: webhookUrl,
      metadata: {
        user_id: userId,
        subscription_type: "monthly",
      },
    };

    const contiResponse = await fetch(
      "https://api.contipay.co.zw/v2/payment/direct",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${credentials}`,
        },
        body: JSON.stringify(contiPayload),
      },
    );

    const contiResult = await contiResponse.json().catch(async () => ({
      message: await contiResponse.text().catch(() => "Unknown error"),
    }));

    if (!contiResponse.ok) {
      console.error("ContiPay error", contiResult);
      return jsonResponse(
        {
          error: "Payment initiation failed. Please try again.",
          details: contiResult.message || "Unknown error",
        },
        502,
      );
    }

    const { error: insertError } = await adminClient
      .from("driver_subscriptions")
      .insert({
        user_id: userId,
        status: "pending",
        amount: 35.0,
        carrier_type,
        phone_number,
        contipay_transaction_id:
          contiResult.transactionId || contiResult.reference || contiPayload.reference,
      });

    if (insertError) {
      console.error("DB insert error", insertError);
      return jsonResponse({ error: "Failed to create subscription record" }, 500);
    }

    return jsonResponse({
      success: true,
      message:
        `A payment prompt has been sent to ${phone_number}. Please enter your PIN on your phone to complete the $35 subscription.`,
      transaction_id: contiResult.transactionId || contiPayload.reference,
    });
  } catch (err) {
    console.error("Subscribe error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
