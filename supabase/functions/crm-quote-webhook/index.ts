import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CSG_API_KEY = Deno.env.get('CSG_API_KEY')!;
const GHL_WEBHOOK_URL = Deno.env.get('GHL_WEBHOOK_URL_CRM_QUOTE')!;

const PREFERRED_CARRIERS: Record<string, string[]> = {
  "Aflac": ["60380"],
  "Medico": ["65641", "79987", "31119"],
};
const PREFERRED_NAIC_CODES = new Set(Object.values(PREFERRED_CARRIERS).flat());

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const SINGLETON_TOKEN_ID = '00000000-0000-0000-0000-000000000001';

function mapPlanToApi(plan: string): string {
  const normalized = plan.toLowerCase().trim();
  const planMap: Record<string, string> = {
    "plan g": "G", "plan n": "N", "plan f": "F",
    "high deductible plan g": "HDF",
    "g": "G", "n": "N", "f": "F",
  };
  return planMap[normalized] || "G";
}

async function getSessionToken(): Promise<string> {
  const { data: existingToken } = await supabase
    .from('csg_api_tokens')
    .select('token, expires_at')
    .eq('id', SINGLETON_TOKEN_ID)
    .maybeSingle();

  if (existingToken) {
    const expiresAt = new Date(existingToken.expires_at);
    const bufferMs = 5 * 60 * 1000;
    if (expiresAt.getTime() - bufferMs > Date.now()) {
      return existingToken.token;
    }
  }

  const authResponse = await fetch('https://api.csgactuarial.com/v1/auth.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: CSG_API_KEY })
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    throw new Error(`CSG authentication failed: ${authResponse.status} - ${errorText}`);
  }

  const authData = await authResponse.json();

  await supabase
    .from('csg_api_tokens')
    .upsert({
      id: SINGLETON_TOKEN_ID,
      token: authData.token,
      expires_at: authData.expires_date,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  return authData.token;
}

async function fetchQuotesWithRetry(
  token: string, queryParams: URLSearchParams, isRetry = false
): Promise<any> {
  const url = `https://api.csgactuarial.com/v1/med_supp/quotes.json?${queryParams}`;
  const response = await fetch(url, { headers: { 'x-api-token': token } });

  if (!response.ok && response.status === 403 && !isRetry) {
    const errorText = await response.text();
    if (errorText.includes("Session Expired") || errorText.includes("Session does not exist")) {
      await supabase.from('csg_api_tokens').delete().eq('id', SINGLETON_TOKEN_ID);
      const freshToken = await getSessionToken();
      return fetchQuotesWithRetry(freshToken, queryParams, true);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch quotes: ${response.status} - ${errorText}`);
  }

  return response.json();
}

function filterQuotes(quotes: any[], hasSpouse: boolean): any[] {
  return quotes.filter(quote => {
    const viewType = quote.view_type || [];
    if (!hasSpouse && viewType.includes("with_hhd")) return false;
    if (hasSpouse && viewType.includes("sans_hhd")) return false;
    return true;
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    console.log("CRM quote webhook received:", JSON.stringify(data));

    // Validate required fields
    const { id, name, email, phone, age, currentPremium, currentType, zip, gender, spouse } = data;
    if (!age || !currentPremium || !currentType || !zip || !gender) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields (age, currentPremium, currentType, zip, gender)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = mapPlanToApi(currentType);
    const hasSpouse = spouse?.toLowerCase() === 'yes';
    const currentPremiumNum = parseFloat(String(currentPremium).replace(/[$,]/g, ''));

    if (isNaN(currentPremiumNum) || currentPremiumNum <= 0) {
      // Can't calculate savings without a valid premium
      const noQuotePayload = {
        id, name, email, phone, plan: currentType, status: "no_quotes",
        quotedRate: null, quotedCarrier: null, amBestRating: null,
        monthlySavings: null, annualSavings: null, savingsPercent: null,
      };
      await postToWebhook(noQuotePayload);
      return new Response(JSON.stringify({ success: true, status: "no_quotes" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Build CSG API query
    const queryParams = new URLSearchParams();
    queryParams.append('zip5', zip);
    queryParams.append('age', age.toString());
    queryParams.append('gender', gender.toLowerCase().startsWith('m') ? 'M' : 'F');
    queryParams.append('tobacco', '0'); // Default to non-tobacco
    queryParams.append('plan', plan);
    queryParams.append('apply_discounts', hasSpouse ? '1' : '0');

    for (const naic of PREFERRED_NAIC_CODES) {
      queryParams.append('naic', naic);
    }

    const neededFields = [
      'company_base.name', 'company_base.naic',
      'company_base.ambest_rating', 'rate.month', 'view_type'
    ];
    for (const field of neededFields) {
      queryParams.append('field', field);
    }

    // Fetch quotes
    const token = await getSessionToken();
    const quotesResponse = await fetchQuotesWithRetry(token, queryParams);
    console.log(`Received ${quotesResponse?.length || 0} raw quotes`);

    const basePayload = { id, name, email, phone, plan: currentType };

    if (!quotesResponse || !Array.isArray(quotesResponse) || quotesResponse.length === 0) {
      const payload = { ...basePayload, status: "no_quotes", quotedRate: null, quotedCarrier: null, amBestRating: null, monthlySavings: null, annualSavings: null, savingsPercent: null };
      await postToWebhook(payload);
      return new Response(JSON.stringify({ success: true, status: "no_quotes" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const filtered = filterQuotes(quotesResponse, hasSpouse);
    if (filtered.length === 0) {
      const payload = { ...basePayload, status: "no_quotes", quotedRate: null, quotedCarrier: null, amBestRating: null, monthlySavings: null, annualSavings: null, savingsPercent: null };
      await postToWebhook(payload);
      return new Response(JSON.stringify({ success: true, status: "no_quotes" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Find best rate
    const processed = filtered
      .map(q => ({
        carrier: q.company_base?.name || "Unknown",
        rate: (q.rate?.month || 0) / 100,
        amBestRating: q.company_base?.ambest_rating || "A-"
      }))
      .sort((a, b) => a.rate - b.rate);

    const best = processed[0];
    const monthlySavings = currentPremiumNum - best.rate;
    const annualSavings = monthlySavings * 12;
    const savingsPercent = (monthlySavings / currentPremiumNum) * 100;

    console.log(`Best: $${best.rate} from ${best.carrier}, savings: ${savingsPercent.toFixed(1)}%`);

    if (savingsPercent < 5) {
      const payload = { ...basePayload, status: "no_savings", quotedRate: best.rate, quotedCarrier: best.carrier, amBestRating: best.amBestRating, monthlySavings: parseFloat(monthlySavings.toFixed(2)), annualSavings: parseFloat(annualSavings.toFixed(2)), savingsPercent: parseFloat(savingsPercent.toFixed(1)) };
      await postToWebhook(payload);
      return new Response(JSON.stringify({ success: true, status: "no_savings" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Success - meaningful savings found
    const payload = {
      ...basePayload,
      status: "quoted",
      quotedRate: best.rate,
      quotedCarrier: best.carrier,
      amBestRating: best.amBestRating,
      monthlySavings: parseFloat(monthlySavings.toFixed(2)),
      annualSavings: parseFloat(annualSavings.toFixed(2)),
      savingsPercent: parseFloat(savingsPercent.toFixed(1)),
    };
    await postToWebhook(payload);

    return new Response(JSON.stringify({ success: true, status: "quoted" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("CRM quote webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function postToWebhook(payload: Record<string, any>) {
  console.log("Posting to GHL webhook:", JSON.stringify(payload));
  try {
    const res = await fetch(GHL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log(`GHL webhook response: ${res.status} - ${text}`);
  } catch (err) {
    console.error("Failed to POST to GHL webhook:", err);
  }
}
