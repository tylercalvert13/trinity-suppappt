import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
  test_event_code?: string;
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

    const { event_name, event_source_url, fbc, fbp, test_event_code }: ConversionRequest = await req.json();

    // Build user data object - only include fields with valid values
    const userData: Record<string, string> = {};
    
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

    // Build the event payload
    const eventData = {
      event_name: event_name || "Lead",
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: event_source_url || "https://healthhelpers.co/supp",
      user_data: userData,
    };

    const payload: Record<string, any> = {
      data: [eventData],
      access_token: accessToken,
    };

    // Add test event code if provided
    if (test_event_code) {
      payload.test_event_code = test_event_code;
    }

    console.log("Sending Facebook Conversion API event:", JSON.stringify({ event_name: eventData.event_name, action_source: eventData.action_source, test_event_code }));

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
