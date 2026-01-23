import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  email: string;
  phone: string;
}

interface EmailValidationResult {
  valid: boolean;
  deliverable: boolean;
  disposable: boolean;
  error?: string;
}

interface PhoneValidationResult {
  valid: boolean;
  type: string | null;
  carrier: string | null;
  error?: string;
}

interface ValidationResponse {
  valid: boolean;
  email: EmailValidationResult;
  phone: PhoneValidationResult;
}

// Skip email validation - always pass (only using phone validation)
async function validateEmail(): Promise<EmailValidationResult> {
  return {
    valid: true,
    deliverable: true,
    disposable: false,
  };
}

// Validate phone using Abstract Phone Intelligence API
async function validatePhone(phone: string, apiKey: string): Promise<PhoneValidationResult> {
  try {
    // Clean phone number - remove formatting
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add US country code if not present
    const phoneWithCode = cleanPhone.length === 10 ? `1${cleanPhone}` : cleanPhone;
    
    const url = `https://phoneintelligence.abstractapi.com/v1/?api_key=${apiKey}&phone=${phoneWithCode}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Phone validation API error:", response.status);
      return { valid: true, type: null, carrier: null, error: "API unavailable" };
    }
    
    const data = await response.json();
    console.log("Phone validation response:", JSON.stringify(data));
    
    // Parse Phone Intelligence API response structure
    const isValid = data.phone_validation?.is_valid === true;
    const lineType = data.phone_carrier?.line_type || null;
    const carrier = data.phone_carrier?.name || null;
    const country = data.phone_location?.country_code || null;
    
    // Phone is valid if: API says valid AND it's a US number
    const valid = isValid && country === "US";
    
    return {
      valid,
      type: lineType,
      carrier,
    };
  } catch (error) {
    console.error("Phone validation error:", error);
    // Fail open - don't block legitimate users if API is down
    return { valid: true, type: null, carrier: null, error: "Validation failed" };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone }: ValidationRequest = await req.json();
    
    if (!email || !phone) {
      return new Response(
        JSON.stringify({ error: "Email and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const phoneApiKey = Deno.env.get("ABSTRACT_PHONE_API_KEY");

    if (!phoneApiKey) {
      console.error("Missing phone API key");
      // Fail open if API key not configured
      return new Response(
        JSON.stringify({
          valid: true,
          email: { valid: true, deliverable: true, disposable: false },
          phone: { valid: true, type: null, carrier: null },
        } as ValidationResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone only (email always passes)
    const [emailResult, phoneResult] = await Promise.all([
      validateEmail(),
      validatePhone(phone, phoneApiKey),
    ]);

    const response: ValidationResponse = {
      valid: emailResult.valid && phoneResult.valid,
      email: emailResult,
      phone: phoneResult,
    };

    console.log("Validation response:", JSON.stringify(response));

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Validation error:", error);
    // Fail open on error
    return new Response(
      JSON.stringify({
        valid: true,
        email: { valid: true, deliverable: true, disposable: false, error: "Service error" },
        phone: { valid: true, type: null, carrier: null, error: "Service error" },
      } as ValidationResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
