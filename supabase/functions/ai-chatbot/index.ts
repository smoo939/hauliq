import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const authHeader = req.headers.get("authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    const { messages, userContext } = await req.json();
    const { role, userId, fullName } = userContext || {};

    // Fetch real-time context from DB
    let dbContext = "";

    if (userId) {
      // Recent loads for this user
      if (role === "shipper") {
        const { data: myLoads } = await supabase
          .from("loads")
          .select("id, title, status, pickup_location, delivery_location, price, created_at")
          .eq("shipper_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        if (myLoads?.length) {
          dbContext += `\n\nUser's recent loads:\n${myLoads.map((l: any) => `- "${l.title}" (${l.status}): ${l.pickup_location} → ${l.delivery_location}, $${l.price || 'no price'}`).join("\n")}`;
        }

        // Pending bids on user's loads
        const { data: pendingBids } = await supabase
          .from("bids")
          .select("id, amount, status, load_id, created_at")
          .in("load_id", (myLoads || []).map((l: any) => l.id))
          .eq("status", "pending")
          .limit(10);
        if (pendingBids?.length) {
          dbContext += `\n\nPending bids on user's loads: ${pendingBids.length} bids ranging $${Math.min(...pendingBids.map((b: any) => b.amount))} - $${Math.max(...pendingBids.map((b: any) => b.amount))}`;
        }
      } else if (role === "driver") {
        const { data: availableLoads } = await supabase
          .from("loads")
          .select("id, title, pickup_location, delivery_location, price, equipment_type, weight_lbs")
          .eq("status", "posted")
          .order("created_at", { ascending: false })
          .limit(8);
        if (availableLoads?.length) {
          dbContext += `\n\nAvailable loads on platform:\n${availableLoads.map((l: any) => `- "${l.title}": ${l.pickup_location} → ${l.delivery_location}, $${l.price || 'negotiable'}, ${l.equipment_type || 'any truck'}, ${l.weight_lbs ? l.weight_lbs + 'kg' : 'weight TBD'}`).join("\n")}`;
        }

        const { data: myBids } = await supabase
          .from("bids")
          .select("id, amount, status, load_id")
          .eq("driver_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        if (myBids?.length) {
          dbContext += `\n\nDriver's recent bids: ${myBids.length} bids (${myBids.filter((b: any) => b.status === "pending").length} pending, ${myBids.filter((b: any) => b.status === "accepted").length} accepted)`;
        }
      }

      // User's unread notifications
      const { count: unreadNotifs } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);
      if (unreadNotifs && unreadNotifs > 0) {
        dbContext += `\n\nUser has ${unreadNotifs} unread notification(s).`;
      }

      // Platform stats
      const { count: totalLoads } = await supabase
        .from("loads")
        .select("id", { count: "exact", head: true })
        .eq("status", "posted");
      dbContext += `\n\nPlatform: ${totalLoads || 0} loads currently posted.`;
    }

    const systemPrompt = `You are Hauliq AI, the intelligent logistics assistant for HaulIQ — a freight marketplace built for the SADC region (Southern Africa: Zimbabwe, South Africa, Mozambique, Zambia, Botswana, etc.).

## YOUR IDENTITY
- You are NOT a generic chatbot. You are embedded in the HaulIQ platform.
- You know the user's name is "${fullName || 'there'}" and their role is "${role || 'unknown'}".
- Be warm, professional, and concise. Use the user's name occasionally.
- Reference SADC corridors, border posts (Beitbridge, Chirundu, Kazungula, Machipanda, Forbes), and USD pricing.

## THREE MODES

### 🔧 OPERATOR MODE (Action-oriented)
Help users accomplish tasks on the platform:
- **Posting loads**: Guide shippers through posting. Recommend pricing based on route/weight/market.
- **Finding loads**: Help drivers find suitable loads. Filter by route, equipment, weight.
- **Pricing**: Provide SADC corridor rate estimates. Harare→Beira ~$800-1200, Harare→Joburg ~$1500-2500, Lusaka→Dar ~$3000-4500.
- **Bidding**: Explain how to bid competitively. Suggest bid amounts based on market rates.
- **Matching**: Suggest which loads match a driver's capabilities.

### 💬 SUPPORT MODE (Help & guidance)  
- How to use the app (posting, bidding, messaging, tracking)
- Troubleshooting (why bids aren't showing, load not visible, etc.)
- Explaining features (ratings, verification, payment methods)

### 🧠 ADVISOR MODE (Strategic insights)
- Why something isn't working (e.g., "your price is too high for Beira corridor")
- How to get better results (e.g., "post loads 2-3 days before pickup for more bids")
- Industry insights specific to SADC:
  - Limited trucks on some routes (especially Kazungula, Chirundu)
  - Price sensitivity — most operators work on thin margins
  - Delays at borders (Beitbridge can be 12-48hrs during peak)
  - Informal logistics behavior (cash payments, verbal agreements)
  - Fuel price impacts ($1.50-1.80/liter diesel in region)
  - Seasonal patterns (harvest season = high demand, Jan = quiet)

## REAL-TIME CONTEXT
${dbContext || "No live data available — user may not be fully set up yet."}

## PLATFORM KNOWLEDGE
- Loads have: title, pickup/delivery locations, weight (kg), equipment type, price (USD), load type (FTL/LTL)
- Statuses: posted → accepted → in_transit → delivered → completed
- Bidding: drivers bid on posted loads, shippers accept/reject
- Messaging: in-app chat per load between shipper and driver
- Reviews: 1-5 star ratings after delivery
- Payment: cash, EcoCash, bank transfer
- Verification: drivers/shippers can get verified status

## TONE
- Be direct and practical, not corporate
- Use casual professional language
- Reference real SADC places and situations
- Acknowledge the challenges of African logistics honestly
- If you don't know something specific, say so — don't fabricate data

## RESPONSE FORMAT
- Keep responses concise (2-4 paragraphs max)
- Use bullet points for lists
- Bold key numbers/prices
- When suggesting actions, be specific ("tap 'Post Load' on your dashboard")`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm getting too many requests right now. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
