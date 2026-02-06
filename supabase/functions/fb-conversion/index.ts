import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FB_PIXEL_ID = "731657259428655";

interface ConversionRequest {
  event_name: string;
  event_source_url?: string;
  fbc?: string;
  fbp?: string;
  event_id?: string;
  external_id?: string;
  test_event_code?: string;
  event_time?: number; // Optional Unix timestamp for historical events
  // User data fields
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  zip_code?: string;
  // Conversion value
  value?: number;
  currency?: string;
}

// Hash a string using SHA-256 (required by Facebook for user data)
async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize phone number to digits only (Facebook requirement)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("FB_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("FB_ACCESS_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "Facebook access token not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { 
      event_name, 
      event_source_url, 
      fbc, 
      fbp, 
      event_id, 
      external_id, 
      test_event_code,
      event_time,
      first_name,
      last_name,
      email,
      phone,
      zip_code,
      value,
      currency
    }: ConversionRequest = await req.json();

    // Build user data object - only include fields with valid values
    const userData: Record<string, string | string[]> = {};
    
    const clientIp = req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || req.headers.get("cf-connecting-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";
    
    if (clientIp && clientIp !== "127.0.0.1") {
      userData.client_ip_address = clientIp;
    }
    if (userAgent) {
      userData.client_user_agent = userAgent;
    }

    // Add Facebook cookies if available
    if (fbc) userData.fbc = fbc;
    if (fbp) userData.fbp = fbp;

    // Add external_id (hashed) for improved match quality
    if (external_id) {
      const hashedExternalId = await hashSHA256(external_id);
      userData.external_id = [hashedExternalId];
    }

    // Hash and add PII fields (Facebook requires all PII to be hashed)
    if (email && email.trim()) {
      userData.em = [await hashSHA256(email)];
    }
    if (phone && phone.trim()) {
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone.length >= 10) {
        userData.ph = [await hashSHA256(normalizedPhone)];
      }
    }
    if (first_name && first_name.trim()) {
      userData.fn = [await hashSHA256(first_name)];
    }
    if (last_name && last_name.trim()) {
      userData.ln = [await hashSHA256(last_name)];
    }
    if (zip_code && zip_code.trim()) {
      // Facebook expects 5-digit zip for US
      const normalizedZip = zip_code.trim().substring(0, 5);
      userData.zp = [await hashSHA256(normalizedZip)];
    }

    // Always set country to US for this Medicare funnel
    userData.country = [await hashSHA256("us")];

    // Build the event payload
    const eventData: Record<string, any> = {
      event_name: event_name || "Lead",
      event_time: event_time || Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: event_source_url || "https://healthhelpers.co/suppquote",
      user_data: userData,
    };

    // Add event_id for deduplication
    if (event_id) {
      eventData.event_id = event_id;
    }

    // Add custom_data with conversion value if provided
    if (value && value > 0) {
      eventData.custom_data = {
        value: value,
        currency: currency || "USD",
      };
    }

    const payload: Record<string, any> = {
      data: [eventData],
      access_token: accessToken,
    };

    // Add test event code if provided
    if (test_event_code) {
      payload.test_event_code = test_event_code;
    }

    // Log what data we're sending (without actual hashed values for privacy)
    console.log("Sending Facebook Conversion API event:", JSON.stringify({ 
      event_name: eventData.event_name, 
      action_source: eventData.action_source, 
      event_id: eventData.event_id,
      has_external_id: !!external_id,
      has_email: !!email,
      has_phone: !!phone,
      has_first_name: !!first_name,
      has_last_name: !!last_name,
      has_zip_code: !!zip_code,
      has_value: !!value,
      value: value,
      test_event_code 
    }));

    // Send to Facebook Conversion API
    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error("Facebook API error:", fbResult);
      return new Response(
        JSON.stringify({ error: "Facebook API error", details: fbResult }),
        { status: fbResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Facebook Conversion API response:", fbResult);

    return new Response(JSON.stringify({ success: true, result: fbResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in fb-conversion function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
