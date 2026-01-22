import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Callback/SMS nurture webhook URL (same GHL webhook, different lead types)
const CALLBACK_WEBHOOK_URL = "https://services.leadconnectorhq.com/hooks/ryRZOfU1dkYsUVlNyUmH/webhook-trigger/bf788398-e01e-4180-ab2f-f4382f13f183";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log("Received after-hours lead request:", JSON.stringify(data));

    // Validate required fields
    if (!data.email) {
      console.error("Missing required field: email");
      return new Response(
        JSON.stringify({ error: "Missing required field: email" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the nextBusinessDay passed from frontend, or calculate it
    let callbackDate = data.nextBusinessDay;
    
    if (!callbackDate) {
      // Fallback calculation if not provided
      const now = new Date();
      const easternNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const hour = easternNow.getHours();
      const dayOfWeek = easternNow.getDay();

      let callbackDateObj = new Date(easternNow);

      // If before 9 AM on a weekday, callback is TODAY
      const isBeforeBusinessHours = hour < 9 && dayOfWeek >= 1 && dayOfWeek <= 5;

      if (!isBeforeBusinessHours) {
        // Add a day
        callbackDateObj.setDate(callbackDateObj.getDate() + 1);
        
        // Skip weekends
        const nextDay = callbackDateObj.getDay();
        if (nextDay === 0) callbackDateObj.setDate(callbackDateObj.getDate() + 1); // Sunday -> Monday
        if (nextDay === 6) callbackDateObj.setDate(callbackDateObj.getDate() + 2); // Saturday -> Monday
      }

      callbackDate = callbackDateObj.toISOString().split('T')[0];
    }

    // Determine lead type (sms_nurture is primary, callback_request is secondary)
    const leadType = data.leadType || 'callback_request';
    
    // Calculate savings if we have the data
    const monthlySavings = data.monthlySavings || 
      (data.currentPayment && data.quotedRate 
        ? data.currentPayment - data.quotedRate 
        : null);
    
    const annualSavings = data.annualSavings || 
      (monthlySavings ? monthlySavings * 12 : null);

    // Build payload for GHL
    const payload = {
      // Contact info
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      
      // Lead type for GHL workflow branching
      leadType: leadType, // "sms_nurture" or "callback_request"
      
      // Callback scheduling info
      callbackDate: callbackDate,
      callbackTimeSlot: data.callbackTime || null, // "morning", "afternoon", or null for SMS nurture
      callbackTimeRange: data.callbackTime 
        ? (data.callbackTime === 'morning' ? '9:00 AM - 12:00 PM ET' : '12:00 PM - 5:00 PM ET')
        : null,
      isToday: data.isToday || false,
      
      // Quote data for personalized messaging
      quotedRate: data.quotedRate,
      currentPayment: data.currentPayment,
      monthlySavings: monthlySavings,
      annualSavings: annualSavings,
      
      // Metadata
      requestedAt: new Date().toISOString(),
      source: leadType === 'sms_nurture' 
        ? "Health Helpers Quote Funnel - SMS Nurture Request"
        : "Health Helpers Quote Funnel - Callback Request",
    };

    console.log("Sending to GHL:", JSON.stringify(payload));

    const response = await fetch(CALLBACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GHL webhook failed:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process request" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("After-hours lead processed successfully:", leadType);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: leadType === 'sms_nurture' 
          ? "SMS nurture scheduled successfully" 
          : "Callback scheduled successfully",
        leadType: leadType,
        callbackDate: callbackDate,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing after-hours lead:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
