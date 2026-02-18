import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIKTOK_PIXEL_ID = "D6ATAMJC77U6DR98LSLG";

interface ConversionRequest {
  event: string;
  event_id?: string;
  event_source_url?: string;
  // PII fields (will be hashed server-side)
  email?: string;
  phone?: string;
  external_id?: string;
  // TikTok matching params
  ttclid?: string;
  ttp?: string;
  // Conversion value
  value?: number;
  currency?: string;
  // Content info
  content_id?: string;
  content_type?: string;
  content_name?: string;
}

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("TIKTOK_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("TIKTOK_ACCESS_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "TikTok access token not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      event,
      event_id,
      event_source_url,
      email,
      phone,
      external_id,
      ttclid,
      ttp,
      value,
      currency,
      content_id,
      content_type,
      content_name,
    }: ConversionRequest = await req.json();

    // Capture IP and UA from request headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() || req.headers.get("cf-connecting-ip") || "";
    const userAgent = req.headers.get("user-agent") || "";

    // Build user object with hashed PII
    const user: Record<string, string> = {};
    if (email && email.trim()) {
      user.email = await hashSHA256(email);
    }
    if (phone && phone.trim()) {
      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone.length >= 10) {
        user.phone_number = await hashSHA256(normalizedPhone);
      }
    }
    if (external_id && external_id.trim()) {
      user.external_id = await hashSHA256(external_id);
    }
    if (ttclid) user.ttclid = ttclid;
    if (ttp) user.ttp = ttp;

    // Build event data
    const eventData: Record<string, any> = {
      event: event || "Lead",
      event_time: Math.floor(Date.now() / 1000),
      context: {
        user_agent: userAgent,
        ip: clientIp,
        page: { url: event_source_url || "https://healthhelpers.co/suppappt" },
        user,
      },
      properties: {
        contents: [{
          content_id: content_id || "suppappt",
          content_type: content_type || "product",
          content_name: content_name || "Medicare Supplement",
        }],
        value: value || 0,
        currency: currency || "USD",
      },
    };

    if (event_id) {
      eventData.event_id = event_id;
    }

    const payload = {
      event_source: "web",
      event_source_id: TIKTOK_PIXEL_ID,
      data: [eventData],
    };

    console.log("Sending TikTok Events API event:", JSON.stringify({
      event: eventData.event,
      event_id: eventData.event_id,
      has_email: !!email,
      has_phone: !!phone,
      has_external_id: !!external_id,
      has_ttclid: !!ttclid,
      has_ttp: !!ttp,
      value,
    }));

    const ttResponse = await fetch(
      "https://business-api.tiktok.com/open_api/v1.3/event/track/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Access-Token": accessToken,
        },
        body: JSON.stringify(payload),
      }
    );

    const ttResult = await ttResponse.json();

    if (!ttResponse.ok) {
      console.error("TikTok API error:", ttResult);
      return new Response(
        JSON.stringify({ error: "TikTok API error", details: ttResult }),
        { status: ttResponse.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("TikTok Events API response:", ttResult);

    return new Response(JSON.stringify({ success: true, result: ttResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in tiktok-conversion function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
