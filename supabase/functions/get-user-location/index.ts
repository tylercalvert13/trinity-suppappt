import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Cloudflare region codes to full state names
const REGION_CODE_TO_STATE: Record<string, string> = {
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
  // Territories
  "PR": "Puerto Rico",
  "VI": "Virgin Islands",
  "GU": "Guam",
  "AS": "American Samoa",
  "MP": "Northern Mariana Islands",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try to get region from Cloudflare headers
    const cfRegion = req.headers.get("cf-region");
    const cfCountry = req.headers.get("cf-ipcountry");
    
    console.log('Location detection headers:', {
      cfRegion,
      cfCountry,
      allHeaders: Object.fromEntries(req.headers.entries())
    });

    // Only return state if it's a US visitor
    if (cfCountry && cfCountry !== "US") {
      console.log('Non-US visitor detected:', cfCountry);
      return new Response(
        JSON.stringify({ state: null, country: cfCountry }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map the region code to full state name
    const state = cfRegion ? REGION_CODE_TO_STATE[cfRegion] || null : null;
    
    console.log('State detection result:', { cfRegion, state });

    return new Response(
      JSON.stringify({ state, regionCode: cfRegion }),
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
