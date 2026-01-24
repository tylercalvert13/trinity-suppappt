import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map state abbreviations to full names
const STATE_ABBREV_TO_NAME: Record<string, string> = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming",
  "DC": "Washington D.C.",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user's IP from headers
    const forwardedFor = req.headers.get("x-forwarded-for");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");
    
    // Parse the first IP from x-forwarded-for (client's original IP)
    const userIp = forwardedFor?.split(',')[0]?.trim() || cfConnectingIp;
    
    console.log('IP detection:', { userIp, forwardedFor, cfConnectingIp });

    if (!userIp) {
      console.log('No IP detected');
      return new Response(
        JSON.stringify({ state: null, error: 'No IP available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use ip-api.com for free IP geolocation (no API key needed, 45 req/min limit)
    const geoResponse = await fetch(`http://ip-api.com/json/${userIp}?fields=status,country,regionName,region`);
    const geoData = await geoResponse.json();
    
    console.log('Geolocation result:', geoData);

    if (geoData.status !== 'success') {
      console.log('Geolocation failed:', geoData);
      return new Response(
        JSON.stringify({ state: null, error: 'Geolocation failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only return state for US visitors
    if (geoData.country !== 'United States') {
      console.log('Non-US visitor:', geoData.country);
      return new Response(
        JSON.stringify({ state: null, country: geoData.country }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the full region name directly from the API, or map from abbreviation
    const state = geoData.regionName || STATE_ABBREV_TO_NAME[geoData.region] || null;
    
    console.log('State detected:', { region: geoData.region, regionName: geoData.regionName, state });

    return new Response(
      JSON.stringify({ state, regionCode: geoData.region }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error detecting location:', error);
    return new Response(
      JSON.stringify({ state: null, error: 'Detection failed' }),
      { 
        status: 200, // Return 200 with null state to allow graceful fallback
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});