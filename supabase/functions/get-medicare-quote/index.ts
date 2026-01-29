import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CSG_API_KEY = Deno.env.get('CSG_API_KEY')!;

// Preferred carriers with their NAIC codes - Medico and AFLAC only
const PREFERRED_CARRIERS: Record<string, string[]> = {
  "Aflac": ["60380"],
  "Medico": ["65641", "79987", "31119"],
};

const PREFERRED_NAIC_CODES = new Set(Object.values(PREFERRED_CARRIERS).flat());

// Create Supabase client with service role for token management
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Fixed UUID for singleton token pattern (column is UUID type, can't use 'singleton' string)
const SINGLETON_TOKEN_ID = '00000000-0000-0000-0000-000000000001';

// Map plan names to API codes (case-insensitive)
function mapPlanToApi(plan: string): string {
  const normalized = plan.toLowerCase().trim();
  const planMap: Record<string, string> = {
    "plan g": "G",
    "plan n": "N",
    "plan f": "F",
    "high deductible plan g": "HDF",
    "g": "G",
    "n": "N",
    "f": "F",
  };
  return planMap[normalized] || "G";
}

// Get or refresh session token from CSG API
// Fixed: Uses valid UUID for singleton pattern + 5-min buffer to prevent race conditions
async function getSessionToken(): Promise<string> {
  console.log("Checking for existing token in database...");
  
  const { data: existingToken, error: fetchError } = await supabase
    .from('csg_api_tokens')
    .select('token, expires_at')
    .eq('id', SINGLETON_TOKEN_ID)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching token:", fetchError);
  }

  // Add 5-minute buffer to prevent race conditions at expiration edge
  if (existingToken) {
    const expiresAt = new Date(existingToken.expires_at);
    const bufferMs = 5 * 60 * 1000; // 5 minutes
    if (expiresAt.getTime() - bufferMs > Date.now()) {
      console.log("Using cached token, expires:", existingToken.expires_at);
      return existingToken.token;
    }
    console.log("Token expired or expiring soon, refreshing...");
  } else {
    console.log("No token found in database, requesting new one...");
  }

  console.log("Requesting new token from CSG API...");
  
  const authResponse = await fetch('https://api.csgactuarial.com/v1/auth.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: CSG_API_KEY })
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    console.error("CSG Auth failed:", authResponse.status, errorText);
    throw new Error(`CSG authentication failed: ${authResponse.status}`);
  }

  const authData = await authResponse.json();
  console.log("Received new token, expires:", authData.expires_date);

  const { error: upsertError } = await supabase
    .from('csg_api_tokens')
    .upsert({
      id: SINGLETON_TOKEN_ID,
      token: authData.token,
      expires_at: authData.expires_date,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (upsertError) {
    // CRITICAL: Log the full error - this was silently failing before!
    console.error("CRITICAL: Token upsert failed:", JSON.stringify(upsertError));
  } else {
    console.log("Token cached successfully");
  }

  return authData.token;
}

// Fetch quotes with automatic retry on session expiration
async function fetchQuotesWithRetry(
  token: string, 
  queryParams: URLSearchParams, 
  isRetry: boolean = false
): Promise<any> {
  const quotesUrl = `https://api.csgactuarial.com/v1/med_supp/quotes.json?${queryParams}`;
  console.log("Fetching quotes from:", quotesUrl);

  const response = await fetch(quotesUrl, {
    headers: { 'x-api-token': token }
  });

  // Handle session expiration with single retry
  if (!response.ok && response.status === 403 && !isRetry) {
    const errorText = await response.text();
    console.log("Got 403 response:", errorText);
    
    if (errorText.includes("Session Expired") || errorText.includes("Session does not exist")) {
      console.log("Token expired/invalid, deleting and refreshing...");
      
      // Delete the singleton token specifically
      await supabase
        .from('csg_api_tokens')
        .delete()
        .eq('id', SINGLETON_TOKEN_ID);

      // Get fresh token and retry once
      const freshToken = await getSessionToken();
      return fetchQuotesWithRetry(freshToken, queryParams, true);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Quote fetch failed:", response.status, errorText);
    throw new Error(`Failed to fetch quotes: ${response.status}`);
  }

  return response.json();
}

// Filter quotes based on household discount status
// Note: Carrier filtering now happens at API level via naic parameter
function filterQuotes(quotes: any[], hasSpouse: boolean): any[] {
  console.log(`Filtering ${quotes.length} quotes, hasSpouse: ${hasSpouse}`);
  
  return quotes.filter(quote => {
    // Household discount filtering based on view_type
    const viewType = quote.view_type || [];
    
    // If no spouse and quote is with household discount, exclude
    if (!hasSpouse && viewType.includes("with_hhd")) {
      return false;
    }
    
    // If has spouse and quote is without household discount, exclude
    if (hasSpouse && viewType.includes("sans_hhd")) {
      return false;
    }

    return true;
  });
}

// Process quotes into simplified format
function processQuotes(quotes: any[]): Array<{carrier: string, rate: number, amBestRating: string}> {
  return quotes
    .map(quote => ({
      carrier: quote.company_base?.name || "Unknown Carrier",
      rate: (quote.rate?.month || 0) / 100, // Convert cents to dollars
      amBestRating: quote.company_base?.ambest_rating || "A-"
    }))
    .sort((a, b) => a.rate - b.rate);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Handle warmup requests - pre-cache session token to eliminate cold start delays
    if (body.action === 'warmup') {
      console.log('Warmup request - pre-caching session token');
      const start = Date.now();
      await getSessionToken();
      console.log(`Warmup complete in ${Date.now() - start}ms`);
      return new Response(
        JSON.stringify({ warmed: true, duration: Date.now() - start }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const data = body;
    console.log("Received quote request:", JSON.stringify(data));

    // Validate required fields
    const requiredFields = ['plan', 'currentPayment', 'gender', 'tobacco', 'spouse', 'age', 'zipCode'];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('zip5', data.zipCode);
    queryParams.append('age', data.age.toString());
    queryParams.append('gender', data.gender === 'male' ? 'M' : 'F');
    queryParams.append('tobacco', data.tobacco === 'yes' ? '1' : '0');
    queryParams.append('plan', mapPlanToApi(data.plan));
    queryParams.append('apply_discounts', data.spouse === 'yes' ? '1' : '0');

    // Filter by preferred carriers at API level (repeatable parameter)
    // This dramatically reduces API response time from 5-15s to 0.5-2s
    for (const naic of PREFERRED_NAIC_CODES) {
      queryParams.append('naic', naic);
    }

    // Request only the fields we need to minimize payload
    const neededFields = [
      'company_base.name',
      'company_base.naic', 
      'company_base.ambest_rating',
      'rate.month',
      'view_type'
    ];
    for (const field of neededFields) {
      queryParams.append('field', field);
    }

    console.log("Query params:", queryParams.toString());

    // Get session token
    const token = await getSessionToken();

    // Fetch quotes
    const quotesResponse = await fetchQuotesWithRetry(token, queryParams);
    console.log(`Received ${quotesResponse?.length || 0} raw quotes from CSG`);

    if (!quotesResponse || !Array.isArray(quotesResponse) || quotesResponse.length === 0) {
      return new Response(
        JSON.stringify({ error: "No quotes available for this criteria" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter and process quotes
    const hasSpouse = data.spouse === 'yes';
    const filteredQuotes = filterQuotes(quotesResponse, hasSpouse);
    console.log(`Filtered to ${filteredQuotes.length} quotes from preferred carriers`);

    if (filteredQuotes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No quotes from preferred carriers for this criteria" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processedQuotes = processQuotes(filteredQuotes);
    const bestQuote = processedQuotes[0];
    const currentPayment = parseFloat(data.currentPayment);

    // Calculate savings percentage
    const savingsPercent = ((currentPayment - bestQuote.rate) / currentPayment) * 100;
    console.log(`Current: $${currentPayment}, Best: $${bestQuote.rate}, Savings: ${savingsPercent.toFixed(1)}%`);

    // If savings less than 5%, return cannotBeatRate
    if (savingsPercent < 5) {
      console.log("Savings below 5%, returning cannotBeatRate");
      return new Response(
        JSON.stringify({ cannotBeatRate: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return successful quote
    const result = {
      rate: bestQuote.rate,
      carrier: bestQuote.carrier,
      amBestRating: bestQuote.amBestRating,
      quotes: processedQuotes.slice(0, 5), // Return top 5 quotes
      monthlySavings: currentPayment - bestQuote.rate,
      annualSavings: (currentPayment - bestQuote.rate) * 12,
      savingsPercent: savingsPercent
    };

    console.log("Returning quote result:", JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error processing quote request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
