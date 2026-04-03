import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function makeSupabase(authHeader: string | null) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }
  return createClient(url, key, {
    global: { headers: { Authorization: authHeader || "" } },
  });
}

async function getUser(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function callAI(apiKey: string, messages: any[], temperature = 0.1) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      temperature,
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    console.error("AI error:", resp.status, errText);
    throw new Error(`AI processing failed (${resp.status})`);
  }
  const data = await resp.json();
  let content = data.choices?.[0]?.message?.content || "";
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return content;
}

function parseJSON(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return { raw: content, valid: false, error: "Could not parse AI result" };
  }
}

// ─── OCR Extract ──────────────────────────────────────────
const OCR_PROMPTS: Record<string, string> = {
  drivers_license: `Analyze this driver's license image. Extract these fields as JSON:
    {"name": "full name", "license_number": "license number", "expiry_date": "YYYY-MM-DD or null", "country": "issuing country", "categories": "license categories/classes", "valid": true/false based on visible quality, "has_photo": true/false}
    If the image is not a valid driver's license, return {"valid": false, "error": "reason"}.`,
  national_id: `Analyze this national ID or passport image. Extract these fields as JSON:
    {"name": "full name", "id_number": "ID/passport number", "expiry_date": "YYYY-MM-DD or null", "country": "issuing country", "valid": true/false, "has_photo": true/false}
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

async function handleOcrExtract(apiKey: string, documentType: string, imageBase64: string) {
  const prompt = OCR_PROMPTS[documentType];
  if (!prompt) {
    return new Response(JSON.stringify({ error: "Invalid document type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const content = await callAI(apiKey, [
    {
      role: "user",
      content: [
        { type: "text", text: prompt + "\nRespond ONLY with valid JSON, no markdown." },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ],
    },
  ]);
  const extracted = parseJSON(content);
  return new Response(JSON.stringify({ success: true, data: extracted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Face Compare ──────────────────────────────────────────
async function handleFaceCompare(apiKey: string, image1Base64: string, image2Base64: string, label1: string, label2: string) {
  const prompt = `You are a face verification expert. Compare the face in Image 1 (${label1}) with the face in Image 2 (${label2}).
Determine if they are the SAME PERSON. Consider that documents may have older photos.
Respond ONLY with valid JSON:
{
  "same_person": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "face_detected_image1": true/false,
  "face_detected_image2": true/false
}`;

  const content = await callAI(apiKey, [
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image1Base64}` } },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image2Base64}` } },
      ],
    },
  ]);
  const result = parseJSON(content);
  return new Response(JSON.stringify({ success: true, data: result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Cross Match Driver ────────────────────────────────────
async function handleCrossMatchDriver(supabase: any, apiKey: string, userId: string) {
  const { data: dv } = await supabase
    .from("driver_verifications")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!dv) {
    return new Response(JSON.stringify({ error: "No verification data found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const issues: string[] = [];
  let allGood = true;
  let needsManualReview = false;

  // 1. Name matching: license ↔ ID
  if (dv.license_name && dv.national_id_name) {
    const ln = dv.license_name.toLowerCase().trim();
    const idn = dv.national_id_name.toLowerCase().trim();
    if (ln !== idn && !ln.includes(idn) && !idn.includes(ln)) {
      issues.push(`Name mismatch: license says "${dv.license_name}" but ID says "${dv.national_id_name}". Please ensure both documents belong to the same person.`);
      allGood = false;
    }
  } else if (!dv.license_name || !dv.national_id_name) {
    issues.push("Missing name data—please upload both license and ID documents.");
    allGood = false;
  }

  // 2. Expiry checks
  const today = new Date().toISOString().split("T")[0];
  if (dv.license_expiry && dv.license_expiry < today) {
    issues.push(`Driver's license expired on ${dv.license_expiry}. Please upload a valid, non-expired license.`);
    allGood = false;
  }

  // 3. Selfie liveness & quality
  if (dv.selfie_status !== "verified") {
    issues.push("Selfie verification incomplete or failed. Please take a clear, live selfie facing the camera.");
    allGood = false;
  }

  // 4. AI Face comparison: license photo ↔ selfie, ID photo ↔ selfie
  if (dv.license_url && dv.selfie_url && dv.national_id_url) {
    try {
      // Fetch all three images
      const [licenseResp, selfieResp, idResp] = await Promise.all([
        fetch(dv.license_url), fetch(dv.selfie_url), fetch(dv.national_id_url),
      ]);

      if (licenseResp.ok && selfieResp.ok && idResp.ok) {
        const [licBuf, selBuf, idBuf] = await Promise.all([
          licenseResp.arrayBuffer(), selfieResp.arrayBuffer(), idResp.arrayBuffer(),
        ]);

        const toB64 = (buf: ArrayBuffer) => {
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary);
        };

        const licB64 = toB64(licBuf);
        const selB64 = toB64(selBuf);
        const idB64 = toB64(idBuf);

        // Compare license photo ↔ selfie
        const facePrompt = (label1: string, label2: string) =>
          `You are a face verification expert. Compare the face in Image 1 (${label1}) with the face in Image 2 (${label2}).
Determine if they are the SAME PERSON. Document photos may be older, so allow for aging.
Respond ONLY with valid JSON:
{"same_person": true/false, "confidence": 0.0-1.0, "reasoning": "brief explanation"}`;

        const [licVsSelfie, idVsSelfie] = await Promise.all([
          callAI(apiKey, [{
            role: "user",
            content: [
              { type: "text", text: facePrompt("Driver's License", "Live Selfie") },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${licB64}` } },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${selB64}` } },
            ],
          }]),
          callAI(apiKey, [{
            role: "user",
            content: [
              { type: "text", text: facePrompt("National ID/Passport", "Live Selfie") },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${idB64}` } },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${selB64}` } },
            ],
          }]),
        ]);

        const licMatch = parseJSON(licVsSelfie);
        const idMatch = parseJSON(idVsSelfie);

        // Update selfie match score with average confidence
        const avgConfidence = ((licMatch.confidence || 0) + (idMatch.confidence || 0)) / 2;
        await supabase.from("driver_verifications").update({
          selfie_match_score: avgConfidence,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);

        if (licMatch.same_person === false) {
          issues.push(`Face does not match license—please retake selfie or re-upload license. (${licMatch.reasoning || ""})`);
          allGood = false;
          if ((licMatch.confidence || 0) > 0.3) needsManualReview = true;
        }
        if (idMatch.same_person === false) {
          issues.push(`Face does not match ID/passport—please retake selfie or re-upload ID. (${idMatch.reasoning || ""})`);
          allGood = false;
          if ((idMatch.confidence || 0) > 0.3) needsManualReview = true;
        }
      } else {
        issues.push("Could not retrieve uploaded documents for face comparison. Please re-upload.");
        allGood = false;
        needsManualReview = true;
      }
    } catch (e) {
      console.error("Face comparison error:", e);
      issues.push("Face comparison could not be completed. Your case has been flagged for manual review.");
      allGood = false;
      needsManualReview = true;
    }
  } else {
    if (!dv.license_url) issues.push("Driver's license not uploaded—please upload it.");
    if (!dv.selfie_url) issues.push("Selfie not uploaded—please take a live selfie.");
    if (!dv.national_id_url) issues.push("National ID/Passport not uploaded—please upload it.");
    allGood = false;
  }

  const newStatus = allGood ? "verified" : needsManualReview ? "manual_review" : "flagged";
  await supabase.from("driver_verifications").update({
    overall_status: newStatus,
    rejection_reason: issues.length ? issues.join("; ") : null,
    verified_at: allGood ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  if (allGood) {
    await supabase.from("profiles").update({
      verified: true,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  return new Response(JSON.stringify({
    action: "VERIFY_DRIVER",
    status: allGood ? "success" : needsManualReview ? "manual_review" : "flagged",
    driver_id: userId,
    issues,
    needs_manual_review: needsManualReview,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Cross Match Truck ─────────────────────────────────────
async function handleCrossMatchTruck(supabase: any, truckId: string) {
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

  // Plate matching: registration vs photo
  if (tv.registration_number && tv.plate_from_photo) {
    const regPlate = tv.registration_number.replace(/\s/g, "").toUpperCase();
    const photoPlate = tv.plate_from_photo.replace(/\s/g, "").toUpperCase();
    if (regPlate !== photoPlate) {
      issues.push(`Plate mismatch: registration "${tv.registration_number}" vs photo "${tv.plate_from_photo}". Ensure the truck photo matches the registered vehicle.`);
      allGood = false;
    }
  }

  // Registration expiry
  if (tv.registration_expiry && tv.registration_expiry < today) {
    issues.push(`Vehicle registration expired on ${tv.registration_expiry}. Please upload a current registration document.`);
    allGood = false;
  }

  // Insurance MUST be current — strict enforcement
  if (!tv.insurance_expiry) {
    issues.push("Insurance expiry date missing. Please upload a valid insurance certificate with a visible expiry date.");
    allGood = false;
  } else if (tv.insurance_expiry < today) {
    issues.push(`Insurance expired on ${tv.insurance_expiry}. You CANNOT operate without valid insurance. Please upload a current insurance certificate.`);
    allGood = false;
  }

  // Insurance must be uploaded
  if (!tv.insurance_url) {
    issues.push("Insurance certificate not uploaded. Valid, up-to-date insurance is mandatory.");
    allGood = false;
  }

  const newStatus = allGood ? "verified" : "flagged";
  await supabase.from("truck_verifications").update({
    overall_status: newStatus,
    rejection_reason: issues.length ? issues.join("; ") : null,
    verified_at: allGood ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", truckId);

  return new Response(JSON.stringify({
    action: "VERIFY_TRUCK",
    status: allGood ? "success" : "flagged",
    truck_id: truckId,
    issues,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Manual Review Request ─────────────────────────────────
async function handleManualReview(supabase: any, userId: string, entityType: string, entityId: string | null, notes: string) {
  const table = entityType === "truck" ? "truck_verifications" : "driver_verifications";
  const filter = entityType === "truck" ? { id: entityId } : { user_id: userId };

  await supabase.from(table).update({
    manual_review_requested: true,
    manual_review_notes: notes,
    overall_status: "manual_review",
    updated_at: new Date().toISOString(),
  }).match(filter);

  return new Response(JSON.stringify({
    success: true,
    message: "Manual review requested. An admin will review your documents within 24-48 hours. You will be notified once the review is complete.",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Main Handler ──────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = makeSupabase(req.headers.get("authorization"));
    const user = await getUser(supabase);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, documentType, imageBase64, userId, truckId, image1Base64, image2Base64, label1, label2, entityType, entityId, notes } = body;

    if (action === "ocr_extract") {
      return await handleOcrExtract(LOVABLE_API_KEY, documentType, imageBase64);
    }

    if (action === "face_compare") {
      return await handleFaceCompare(LOVABLE_API_KEY, image1Base64, image2Base64, label1 || "Image 1", label2 || "Image 2");
    }

    if (action === "cross_match") {
      return await handleCrossMatchDriver(supabase, LOVABLE_API_KEY, userId || user.id);
    }

    if (action === "cross_match_truck") {
      return await handleCrossMatchTruck(supabase, truckId);
    }

    if (action === "manual_review") {
      return await handleManualReview(supabase, userId || user.id, entityType || "driver", entityId, notes || "");
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
