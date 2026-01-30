import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GHL_WEBHOOK_URL = Deno.env.get('GHL_WEBHOOK_URL_SUPPAPPT')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log("Received lead data (suppappt-refund):", JSON.stringify(data));

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone) {
      return new Response(
        JSON.stringify({ error: "Missing required contact fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate savings if we have the data
    const monthlySavings = data.currentPayment && data.quotedRate 
      ? (parseFloat(data.currentPayment) - parseFloat(data.quotedRate)).toFixed(2)
      : null;
    const annualSavings = monthlySavings 
      ? (parseFloat(monthlySavings) * 12).toFixed(2)
      : null;

    // Build payload for GHL
    const payload = {
      // Contact info
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      
      // Demographics
      age: data.age,
      zipCode: data.zipCode,
      gender: data.gender,
      tobacco: data.tobacco,
      spouse: data.spouse,
      
      // Plan details
      plan: data.plan,
      currentPayment: data.currentPayment,
      
      // Quote results
      quotedRate: data.quotedRate,
      quotedCarrier: data.quotedCarrier,
      amBestRating: data.amBestRating,
      monthlySavings,
      annualSavings,
      savingsPercent: data.savingsPercent,
      
      // Timezone (IANA format, e.g., "America/New_York")
      timezone: data.timezone || null,
      
      // Metadata
      timestamp: new Date().toISOString(),
      source: "Health Helpers Quote Funnel",
      page: data.page || "suppappt-refund",
      
      // Session tracking (if available)
      visitorId: data.visitorId,
      sessionId: data.sessionId,
    };

    console.log("Sending to GHL webhook (suppappt-refund):", GHL_WEBHOOK_URL);
    console.log("Payload:", JSON.stringify(payload));

    // Send to GHL webhook
    const response = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GHL webhook failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send lead to CRM", details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consume response body
    const responseText = await response.text();
    console.log("GHL webhook response:", responseText);

    return new Response(
      JSON.stringify({ success: true, message: "Lead sent successfully" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error sending lead:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
