import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, load, loads } = await req.json();

    let systemPrompt: string;
    let userPrompt: string;
    let tools: any[];
    let tool_choice: any;

    if (action === "match-carriers") {
      systemPrompt = `You are a SADC logistics AI assistant for HaulIQ, a freight marketplace in Southern Africa. Analyze loads and suggest the best carrier matches based on route, equipment, weight, timing, and market conditions. Consider SADC corridor routes (Beitbridge, Chirundu, Kazungula, Machipanda). Use USD pricing typical for Zimbabwe/SADC freight markets.`;

      userPrompt = `Analyze this load and suggest 3 ideal carrier profiles:
Title: ${load.title}
Pickup: ${load.pickup_location}
Delivery: ${load.delivery_location}
Weight: ${load.weight_lbs ? load.weight_lbs + ' kg' : 'Not specified'}
Equipment: ${load.equipment_type || 'Not specified'}
Load Type: ${load.load_type || 'FTL'}
Budget: $${load.price}
Pickup Date: ${load.pickup_date || 'Flexible'}`;

      tools = [{
        type: "function",
        function: {
          name: "suggest_carriers",
          description: "Return 3 ideal carrier matches for a load",
          parameters: {
            type: "object",
            properties: {
              carriers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rank: { type: "number" },
                    carrier_type: { type: "string", description: "e.g. Owner-operator, Fleet company, Cross-border specialist" },
                    equipment_match: { type: "string", description: "Recommended truck/trailer type" },
                    estimated_rate_usd: { type: "number" },
                    confidence_pct: { type: "number", description: "Match confidence 0-100" },
                    reasoning: { type: "string", description: "Why this carrier type is ideal" },
                    route_notes: { type: "string", description: "Route-specific tips (border crossings, road conditions)" },
                  },
                  required: ["rank", "carrier_type", "equipment_match", "estimated_rate_usd", "confidence_pct", "reasoning", "route_notes"],
                  additionalProperties: false,
                },
              },
              market_insight: { type: "string", description: "Brief market context for this route/corridor" },
            },
            required: ["carriers", "market_insight"],
            additionalProperties: false,
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "suggest_carriers" } };

    } else if (action === "dynamic-pricing") {
      systemPrompt = `You are a SADC freight pricing engine for HaulIQ. Calculate fair market rates for loads based on distance, weight, equipment, route difficulty (border crossings, fuel costs, road conditions), and current market demand. Use USD pricing. Be precise and data-driven.`;

      userPrompt = `Calculate dynamic pricing for this load:
Title: ${load.title}
Pickup: ${load.pickup_location}
Delivery: ${load.delivery_location}
Weight: ${load.weight_lbs ? load.weight_lbs + ' kg' : 'Not specified'}
Equipment: ${load.equipment_type || 'General'}
Load Type: ${load.load_type || 'FTL'}
Shipper Budget: $${load.price}`;

      tools = [{
        type: "function",
        function: {
          name: "calculate_pricing",
          description: "Return dynamic pricing analysis for a load",
          parameters: {
            type: "object",
            properties: {
              recommended_rate_usd: { type: "number" },
              rate_range_low_usd: { type: "number" },
              rate_range_high_usd: { type: "number" },
              rate_per_km_usd: { type: "number" },
              estimated_distance_km: { type: "number" },
              fuel_cost_estimate_usd: { type: "number" },
              platform_fee_usd: { type: "number", description: "10% platform fee" },
              driver_payout_usd: { type: "number" },
              price_factors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    factor: { type: "string" },
                    impact: { type: "string", enum: ["increases", "decreases", "neutral"] },
                    detail: { type: "string" },
                  },
                  required: ["factor", "impact", "detail"],
                  additionalProperties: false,
                },
              },
              market_comparison: { type: "string", description: "How this compares to typical market rates" },
            },
            required: ["recommended_rate_usd", "rate_range_low_usd", "rate_range_high_usd", "rate_per_km_usd", "estimated_distance_km", "fuel_cost_estimate_usd", "platform_fee_usd", "driver_payout_usd", "price_factors", "market_comparison"],
            additionalProperties: false,
          },
        },
      }];
      tool_choice = { type: "function", function: { name: "calculate_pricing" } };

    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use 'match-carriers' or 'dynamic-pricing'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No AI result returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ action, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-load-matching error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
