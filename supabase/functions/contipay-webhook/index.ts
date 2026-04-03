import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[contipay-webhook] Missing env vars", {
        hasUrl: !!supabaseUrl,
        hasServiceRole: !!serviceRoleKey,
      });
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    console.log("[contipay-webhook] Received:", JSON.stringify(payload));

    const transactionId =
      payload.transactionId || payload.reference || payload.transaction_id;
    const status = (payload.status || "").toLowerCase();

    if (!transactionId) {
      return new Response(JSON.stringify({ error: "Missing transaction ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (status === "success" || status === "completed" || status === "paid") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { data: sub, error: updateError } = await supabase
        .from("driver_subscriptions")
        .update({
          status: "active",
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("contipay_transaction_id", transactionId)
        .eq("status", "pending")
        .select()
        .single();

      if (updateError) {
        console.error("Subscription update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update subscription" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (sub) {
        await supabase.from("notifications").insert({
          user_id: sub.user_id,
          title: "Subscription Activated! 🎉",
          body: `Your $35 monthly carrier subscription is active until ${expiresAt.toLocaleDateString()}.`,
          type: "subscription",
        });
      }

      console.log("Subscription activated for transaction:", transactionId);
    } else if (status === "failed" || status === "cancelled") {
      await supabase
        .from("driver_subscriptions")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("contipay_transaction_id", transactionId)
        .eq("status", "pending");

      console.log("Subscription payment failed for:", transactionId);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
