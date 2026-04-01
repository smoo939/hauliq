import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SubscribeSchema = z.object({
  phone_number: z.string().min(10).max(15),
  carrier_type: z.enum(["EcoCash", "InnBucks", "OneMoney", "Telecash"]),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use anon client to validate the JWT via getClaims
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string) || "";

    // Service role client for DB operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate input
    const parsed = SubscribeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phone_number, carrier_type } = parsed.data;

    // Check for existing active subscription
    const { data: existingSub } = await adminClient
      .from("driver_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingSub) {
      return new Response(
        JSON.stringify({
          error: "You already have an active subscription",
          expires_at: existingSub.expires_at,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const merchantCodes: Record<string, string> = {
      EcoCash: "EC",
      InnBucks: "IB",
      OneMoney: "OM",
      Telecash: "TC",
    };

    const apiKey = Deno.env.get("CONTIPAY_API_KEY")!;
    const apiSecret = Deno.env.get("CONTIPAY_API_SECRET")!;
    const credentials = btoa(`${apiKey}:${apiSecret}`);
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/contipay-webhook`;

    const contiPayload = {
      merchantCode: merchantCodes[carrier_type] || "EC",
      currency: "USD",
      amount: 35.0,
      customerPhone: phone_number,
      customerEmail: userEmail,
      description: "HaulIQ Driver Monthly Subscription",
      reference: `HAULIQ-SUB-${userId.slice(0, 8)}-${Date.now()}`,
      callbackUrl: webhookUrl,
      metadata: { user_id: userId, subscription_type: "monthly" },
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
      }
    );

    const contiResult = await contiResponse.json();

    if (!contiResponse.ok) {
      console.error("ContiPay error:", contiResult);
      return new Response(
        JSON.stringify({
          error: "Payment initiation failed. Please try again.",
          details: contiResult.message || "Unknown error",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      console.error("DB insert error:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `A payment prompt has been sent to ${phone_number}. Please enter your PIN on your phone to complete the $35 subscription.`,
        transaction_id: contiResult.transactionId || contiPayload.reference,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Subscribe error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
