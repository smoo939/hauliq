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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, documentType, imageBase64, userId, truckId } = await req.json();

    if (action === "ocr_extract") {
      // Use AI to extract document fields via OCR
      const prompts: Record<string, string> = {
        drivers_license: `Analyze this driver's license image. Extract these fields as JSON:
          {"name": "full name", "license_number": "license number", "expiry_date": "YYYY-MM-DD or null", "country": "issuing country", "categories": "license categories/classes", "valid": true/false based on visible quality}
          If the image is not a valid driver's license, return {"valid": false, "error": "reason"}.`,
        national_id: `Analyze this national ID or passport image. Extract these fields as JSON:
          {"name": "full name", "id_number": "ID/passport number", "expiry_date": "YYYY-MM-DD or null", "country": "issuing country", "valid": true/false}
          If not a valid ID document, return {"valid": false, "error": "reason"}.`,
        selfie: `Analyze this selfie photo. Determine:
          {"face_detected": true/false, "face_count": number, "quality": "good"/"poor"/"blurry", "liveness_indicators": "natural"/"suspicious"/"printed_photo"}
          Check if this looks like a real person (not a photo of a photo, not a screen capture).`,
        registration: `Analyze this vehicle registration document. Extract:
          {"plate_number": "registration plate", "owner_name": "registered owner", "vehicle_make": "make", "vehicle_model": "model", "expiry_date": "YYYY-MM-DD or null", "valid": true/false}`,
        insurance: `Analyze this vehicle insurance document. Extract:
          {"policy_number": "policy number", "insured_name": "insured party", "plate_number": "vehicle plate", "expiry_date": "YYYY-MM-DD or null", "coverage_type": "type of coverage", "valid": true/false}`,
        truck_photo: `Analyze this truck/vehicle photo. Extract:
          {"plate_visible": true/false, "plate_number": "plate number if visible or null", "vehicle_type": "truck type description", "condition": "good"/"fair"/"poor", "valid": true/false}`,
      };

      const prompt = prompts[documentType];
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Invalid document type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt + "\nRespond ONLY with valid JSON, no markdown." },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI OCR error:", aiResponse.status, errText);
        return new Response(JSON.stringify({ error: "AI processing failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      let content = aiData.choices?.[0]?.message?.content || "";
      // Strip markdown code fences if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const extracted = JSON.parse(content);
        return new Response(JSON.stringify({ success: true, data: extracted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ success: true, data: { raw: content, valid: false, error: "Could not parse OCR result" } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "cross_match") {
      // Cross-match driver documents
      const { data: dv } = await supabase
        .from("driver_verifications")
        .select("*")
        .eq("user_id", userId || user.id)
        .single();

      if (!dv) {
        return new Response(JSON.stringify({ error: "No verification data found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const issues: string[] = [];
      let allGood = true;

      // Name matching
      if (dv.license_name && dv.national_id_name) {
        const ln = dv.license_name.toLowerCase().trim();
        const idn = dv.national_id_name.toLowerCase().trim();
        if (ln !== idn && !ln.includes(idn) && !idn.includes(ln)) {
          issues.push(`Name mismatch: license says "${dv.license_name}" but ID says "${dv.national_id_name}"`);
          allGood = false;
        }
      }

      // Expiry checks
      const today = new Date().toISOString().split("T")[0];
      if (dv.license_expiry && dv.license_expiry < today) {
        issues.push(`Driver's license expired on ${dv.license_expiry}`);
        allGood = false;
      }

      // Selfie quality
      if (dv.selfie_match_score !== null && dv.selfie_match_score < 0.5) {
        issues.push("Selfie verification failed - face does not match license photo");
        allGood = false;
      }

      const newStatus = allGood ? "verified" : "flagged";
      await supabase
        .from("driver_verifications")
        .update({
          overall_status: newStatus,
          rejection_reason: issues.length ? issues.join("; ") : null,
          verified_at: allGood ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId || user.id);

      if (allGood) {
        await supabase
          .from("profiles")
          .update({ verified: true, updated_at: new Date().toISOString() })
          .eq("user_id", userId || user.id);
      }

      return new Response(JSON.stringify({
        action: "VERIFY_DRIVER",
        status: allGood ? "success" : "flagged",
        driver_id: userId || user.id,
        issues,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "cross_match_truck") {
      const { data: tv } = await supabase
        .from("truck_verifications")
        .select("*")
        .eq("id", truckId)
        .single();

      if (!tv) {
        return new Response(JSON.stringify({ error: "No truck verification found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const issues: string[] = [];
      let allGood = true;
      const today = new Date().toISOString().split("T")[0];

      // Plate matching: registration vs photo vs insurance
      if (tv.registration_number && tv.plate_from_photo) {
        const regPlate = tv.registration_number.replace(/\s/g, "").toUpperCase();
        const photoPlate = tv.plate_from_photo.replace(/\s/g, "").toUpperCase();
        if (regPlate !== photoPlate) {
          issues.push(`Plate mismatch: registration "${tv.registration_number}" vs photo "${tv.plate_from_photo}"`);
          allGood = false;
        }
      }
      if (tv.registration_number && tv.insurance_number) {
        // insurance_number here stores the plate from insurance doc
      }

      if (tv.registration_expiry && tv.registration_expiry < today) {
        issues.push(`Vehicle registration expired on ${tv.registration_expiry}`);
        allGood = false;
      }
      if (tv.insurance_expiry && tv.insurance_expiry < today) {
        issues.push(`Insurance expired on ${tv.insurance_expiry}`);
        allGood = false;
      }

      const newStatus = allGood ? "verified" : "flagged";
      await supabase
        .from("truck_verifications")
        .update({
          overall_status: newStatus,
          rejection_reason: issues.length ? issues.join("; ") : null,
          verified_at: allGood ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", truckId);

      return new Response(JSON.stringify({
        action: "VERIFY_TRUCK",
        status: allGood ? "success" : "flagged",
        truck_id: truckId,
        issues,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
