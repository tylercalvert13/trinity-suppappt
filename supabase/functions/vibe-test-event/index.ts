import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vibe.co Pixel ID
    const pixelId = 'FW7mXo';
    const timestamp = Date.now();
    
    // Try multiple possible Vibe.co tracking endpoints
    const endpoints = [
      `https://s.vibe.co/p?pid=${pixelId}&ev=lead&_t=${timestamp}`,
      `https://vibe.co/api/track?pid=${pixelId}&event=lead&_t=${timestamp}`,
      `https://api.vibe.co/v1/track?pixel_id=${pixelId}&event_name=lead`,
    ];
    
    const results = [];
    
    for (const url of endpoints) {
      try {
        console.log('Trying endpoint:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'HealthHelpers-Server/1.0',
            'Accept': '*/*',
          },
        });
        
        const status = response.status;
        const text = await response.text();
        
        results.push({
          url,
          status,
          body: text.substring(0, 200),
          success: status >= 200 && status < 400
        });
        
        console.log(`Endpoint ${url}: status=${status}`);
      } catch (e) {
        results.push({
          url,
          error: e.message,
          success: false
        });
      }
    }

    // Also try a POST to their conversion API
    try {
      const postUrl = 'https://s.vibe.co/conv';
      const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HealthHelpers-Server/1.0',
        },
        body: JSON.stringify({
          pixel_id: pixelId,
          event: 'lead',
          timestamp: timestamp,
        }),
      });
      
      results.push({
        url: postUrl,
        method: 'POST',
        status: postResponse.status,
        body: (await postResponse.text()).substring(0, 200),
        success: postResponse.status >= 200 && postResponse.status < 400
      });
    } catch (e) {
      results.push({
        url: 'https://s.vibe.co/conv',
        method: 'POST',
        error: e.message,
        success: false
      });
    }

    console.log('All results:', JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test lead events sent to Vibe.co',
        pixelId,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error sending Vibe.co test event:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
