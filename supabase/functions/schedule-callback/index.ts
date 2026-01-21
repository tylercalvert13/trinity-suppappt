import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Callback scheduling webhook URL
const CALLBACK_WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/ryRZOfU1dkYsUVlNyUmH/webhook-trigger/bf788398-e01e-4180-ab2f-f4382f13f183";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log("Received callback request:", JSON.stringify(data));

    // Validate required fields
    if (!data.email || !data.callbackTime) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and callbackTime" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate the actual callback date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const callbackDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Build payload for GHL
    const payload = {
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      callbackDate: callbackDate,
      callbackTimeSlot: data.callbackTime, // "morning" or "afternoon"
      callbackTimeRange: data.callbackTime === 'morning' ? '9:00 AM - 12:00 PM ET' : '12:00 PM - 5:00 PM ET',
      requestedAt: new Date().toISOString(),
      source: "Health Helpers Quote Funnel - Callback Request",
      
      // Include quote data for context
      quotedRate: data.quotedRate,
      currentPayment: data.currentPayment,
      monthlySavings: data.monthlySavings,
    };

    console.log("Sending callback request to GHL:", JSON.stringify(payload));

    const response = await fetch(CALLBACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Callback webhook failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to schedule callback" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Callback scheduled successfully");
    return new Response(
      JSON.stringify({ success: true, message: "Callback scheduled successfully" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error scheduling callback:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
