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

const SUBSCRIPTION_AMOUNT = 35.0;
const CONFIG_ERRORS = {
  supabaseUrl: "CRITICAL: SUPABASE_URL_MISSING",
  supabaseAnonKey: "CRITICAL: SUPABASE_ANON_KEY_MISSING",
  serviceRoleKey: "CRITICAL: SUPABASE_SERVICE_ROLE_KEY_MISSING",
  contipayKey: "CRITICAL: CONTIPAY_TEST_KEY_MISSING",
  contipaySecret: "CRITICAL: CONTIPAY_API_SECRET_MISSING",
} as const;

type RuntimeEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  serviceRoleKey: string;
  contipayApiKey: string;
  contipayApiSecret: string;
  usingTestKey: boolean;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getAuthorizationHeader(req: Request): string {
  return req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
}

function getTrimmedEnv(name: string): string {
  return Deno.env.get(name)?.trim() ?? "";
}

function resolveRuntimeEnv(req: Request): RuntimeEnv {
  const supabaseUrl = getTrimmedEnv("SUPABASE_URL");
  const supabaseAnonKey = getTrimmedEnv("SUPABASE_ANON_KEY");
  const serviceRoleKey = getTrimmedEnv("SUPABASE_SERVICE_ROLE_KEY");
  const contipayTestKey = getTrimmedEnv("CONTIPAY_TEST_KEY");
  const contipayApiKey = getTrimmedEnv("CONTIPAY_API_KEY");
  const contipayApiSecret = getTrimmedEnv("CONTIPAY_API_SECRET");

  console.log("[contipay-subscribe] Runtime env presence", {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    hasContipayTestKey: Boolean(contipayTestKey),
    hasContipayApiKey: Boolean(contipayApiKey),
    hasContipayApiSecret: Boolean(contipayApiSecret),
    hasAuthorizationHeader: Boolean(getAuthorizationHeader(req)),
  });

  if (!supabaseUrl) {
    throw new Error(CONFIG_ERRORS.supabaseUrl);
  }

  if (!supabaseAnonKey) {
    throw new Error(CONFIG_ERRORS.supabaseAnonKey);
  }

  if (!serviceRoleKey) {
    throw new Error(CONFIG_ERRORS.serviceRoleKey);
  }

  if (!contipayTestKey && !contipayApiKey) {
    throw new Error(CONFIG_ERRORS.contipayKey);
  }

  if (!contipayApiSecret) {
    throw new Error(CONFIG_ERRORS.contipaySecret);
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    serviceRoleKey,
    contipayApiKey: contipayTestKey || contipayApiKey,
    contipayApiSecret,
    usingTestKey: Boolean(contipayTestKey),
  };
}

function createUserClient(req: Request) {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: {
          Authorization: getAuthorizationHeader(req),
        },
      },
    },
  );
}

function createAdminClient(req: Request) {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  if (!serviceRoleKey) {
    throw new Error(CONFIG_ERRORS.serviceRoleKey);
  }

  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    {
      global: {
        headers: {
          Authorization: getAuthorizationHeader(req),
        },
      },
    },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const runtimeEnv = resolveRuntimeEnv(req);
    const authHeader = getAuthorizationHeader(req);

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

    const userClient = createUserClient(req);
    const adminClient = createAdminClient(req);

    const { data: userData, error: userError } =
      await userClient.auth.getUser(token);

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

    console.log("[contipay-subscribe] ContiPay credentials resolved", {
      usingTestKey: runtimeEnv.usingTestKey,
      hasApiSecret: Boolean(runtimeEnv.contipayApiSecret),
    });

    const credentials = btoa(
      `${runtimeEnv.contipayApiKey}:${runtimeEnv.contipayApiSecret}`,
    );
    const webhookUrl = `${runtimeEnv.supabaseUrl}/functions/v1/contipay-webhook`;

    const contiPayload = {
      merchantCode: merchantCodes[carrier_type] || "EC",
      currency: "USD",
      amount: SUBSCRIPTION_AMOUNT,
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
        amount: SUBSCRIPTION_AMOUNT,
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
        `A payment prompt has been sent to ${phone_number}. Please enter your PIN on your phone to complete the $${SUBSCRIPTION_AMOUNT} subscription.`,
      transaction_id: contiResult.transactionId || contiPayload.reference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (Object.values(CONFIG_ERRORS).includes(message as (typeof CONFIG_ERRORS)[keyof typeof CONFIG_ERRORS])) {
      console.error("[contipay-subscribe] Configuration error", { error: message });
      return jsonResponse({ error: message }, 500);
    }

    console.error("Subscribe error", { error: message });
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
