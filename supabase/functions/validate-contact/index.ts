import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  email?: string;
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

// Skip email validation - always pass
function validateEmail(): EmailValidationResult {
  return {
    valid: true,
    deliverable: true,
    disposable: false,
  };
}

// Fast internal phone validation - no external API call
function validatePhoneInternal(phone: string): PhoneValidationResult {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Must be exactly 10 digits
  if (cleanPhone.length !== 10) {
    console.log(`Phone validation failed: ${cleanPhone.length} digits (need 10)`);
    return { valid: false, type: null, carrier: null, error: "Must be 10 digits" };
  }
  
  const areaCode = cleanPhone.substring(0, 3);
  const exchange = cleanPhone.substring(3, 6);
  
  // Invalid area codes (can't start with 0 or 1, or be service/fake codes)
  const invalidAreaCodes = ['000', '111', '211', '311', '411', '511', '611', '711', '811', '911'];
  if (areaCode.startsWith('0') || areaCode.startsWith('1') || invalidAreaCodes.includes(areaCode)) {
    console.log(`Phone validation failed: invalid area code ${areaCode}`);
    return { valid: false, type: null, carrier: null, error: "Invalid area code" };
  }
  
  // 555-0100 through 555-0199 are reserved for fiction
  if (exchange === '555') {
    const lastFour = cleanPhone.substring(6);
    if (lastFour >= '0100' && lastFour <= '0199') {
      console.log(`Phone validation failed: fictional number (555-01xx)`);
      return { valid: false, type: null, carrier: null, error: "Invalid phone number" };
    }
  }
  
  // Reject obvious fake patterns
  const fakePatterns = [
    '1234567890', '0987654321', '1111111111', '2222222222',
    '3333333333', '4444444444', '5555555555', '6666666666',
    '7777777777', '8888888888', '9999999999', '0000000000'
  ];
  if (fakePatterns.includes(cleanPhone)) {
    console.log(`Phone validation failed: fake pattern detected`);
    return { valid: false, type: null, carrier: null, error: "Invalid phone number" };
  }
  
  console.log(`Phone validation passed: ${cleanPhone.substring(0, 3)}-XXX-XXXX`);
  return { valid: true, type: 'unknown', carrier: null };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone }: ValidationRequest = await req.json();
    
    // Phone is required; email is optional
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Instant validation - no external API calls
    const emailResult = validateEmail();
    const phoneResult = validatePhoneInternal(phone);

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
