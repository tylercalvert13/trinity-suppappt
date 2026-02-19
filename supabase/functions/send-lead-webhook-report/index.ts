import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GHL_WEBHOOK_URL = Deno.env.get('GHL_WEBHOOK_URL_REPORT')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log("Received lead data (report):", JSON.stringify(data));

    // Only firstName + phone required for this funnel
    if (!data.firstName || !data.phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: firstName and phone" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const monthlySavings = data.currentPayment && data.quotedRate 
      ? (parseFloat(data.currentPayment) - parseFloat(data.quotedRate)).toFixed(2)
      : null;
    const annualSavings = monthlySavings 
      ? (parseFloat(monthlySavings) * 12).toFixed(2)
      : null;

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName || '',
      name: data.firstName,
      email: data.email || '',
      phone: data.phone,
      
      age: data.age,
      zipCode: data.zipCode,
      gender: data.gender,
      tobacco: data.tobacco,
      spouse: data.spouse,
      
      plan: data.plan,
      currentPayment: data.currentPayment,
      
      quotedRate: data.quotedRate,
      quotedCarrier: data.quotedCarrier,
      amBestRating: data.amBestRating,
      monthlySavings,
      annualSavings,
      savingsPercent: data.savingsPercent,
      
      timezone: data.timezone || null,
      
      timestamp: new Date().toISOString(),
      source: "Health Helpers Rate Report Funnel",
      page: "report",
      
      visitorId: data.visitorId,
      sessionId: data.sessionId,
      
      trustedFormCertUrl: data.trustedFormCertUrl || null,
      xxTrustedFormCertUrl: data.trustedFormCertUrl || null,
    };

    console.log("Sending to GHL webhook (report):", GHL_WEBHOOK_URL);
    console.log("Payload:", JSON.stringify(payload));

    const response = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
