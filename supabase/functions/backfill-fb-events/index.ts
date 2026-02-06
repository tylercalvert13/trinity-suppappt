import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FB_PIXEL_ID = "731657259428655";

// Hash a string using SHA-256 (required by Facebook for user data)
async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize phone number to digits only (Facebook requirement)
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

interface Submission {
  id: string;
  visitor_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  zip_code: string | null;
  monthly_savings: number | null;
  page: string | null;
  created_at: string;
}

interface BackfillResult {
  id: string;
  success: boolean;
  error?: string;
  fb_response?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("FB_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("FB_ACCESS_TOKEN is not configured");
      return new Response(
        JSON.stringify({ error: "Facebook access token not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query submissions that need backfilling
    const { data: submissions, error: queryError } = await supabase
      .from('submissions')
      .select('id, visitor_id, first_name, last_name, email, phone, zip_code, monthly_savings, page, created_at')
      .in('page', ['suppappt', 'suppappt1', 'suppappt-refund'])
      .eq('submission_type', 'success')
      .gte('created_at', '2026-02-05T19:00:00+00:00')
      .order('created_at', { ascending: true });

    if (queryError) {
      console.error("Error querying submissions:", queryError);
      return new Response(
        JSON.stringify({ error: "Failed to query submissions", details: queryError }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${submissions?.length || 0} submissions to backfill`);

    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No submissions found to backfill", count: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results: BackfillResult[] = [];

    for (const submission of submissions as Submission[]) {
      try {
        console.log(`Processing submission ${submission.id} from ${submission.created_at}`);

        // Convert created_at to Unix timestamp
        const eventTime = Math.floor(new Date(submission.created_at).getTime() / 1000);

        // Build user data object
        const userData: Record<string, string | string[]> = {};

        // Add external_id (hashed) for improved match quality
        if (submission.visitor_id) {
          const hashedExternalId = await hashSHA256(submission.visitor_id);
          userData.external_id = [hashedExternalId];
        }

        // Hash and add PII fields
        if (submission.email && submission.email.trim()) {
          userData.em = [await hashSHA256(submission.email)];
        }
        if (submission.phone && submission.phone.trim()) {
          const normalizedPhone = normalizePhone(submission.phone);
          if (normalizedPhone.length >= 10) {
            userData.ph = [await hashSHA256(normalizedPhone)];
          }
        }
        if (submission.first_name && submission.first_name.trim()) {
          userData.fn = [await hashSHA256(submission.first_name)];
        }
        if (submission.last_name && submission.last_name.trim()) {
          userData.ln = [await hashSHA256(submission.last_name)];
        }
        if (submission.zip_code && submission.zip_code.trim()) {
          const normalizedZip = submission.zip_code.trim().substring(0, 5);
          userData.zp = [await hashSHA256(normalizedZip)];
        }

        // Always set country to US
        userData.country = [await hashSHA256("us")];

        // Build the event payload
        const eventData: Record<string, any> = {
          event_name: "submission",
          event_time: eventTime,
          action_source: "website",
          event_source_url: `https://healthhelpers.co/${submission.page || 'suppappt'}`,
          user_data: userData,
        };

        // Add conversion value if available
        if (submission.monthly_savings && submission.monthly_savings > 0) {
          eventData.custom_data = {
            value: submission.monthly_savings,
            currency: "USD",
          };
        }

        const payload = {
          data: [eventData],
          access_token: accessToken,
        };

        // Send to Facebook Conversion API
        const fbResponse = await fetch(
          `https://graph.facebook.com/v18.0/${FB_PIXEL_ID}/events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const fbResult = await fbResponse.json();

        if (!fbResponse.ok) {
          console.error(`Facebook API error for ${submission.id}:`, fbResult);
          results.push({
            id: submission.id,
            success: false,
            error: fbResult.error?.message || "Facebook API error",
            fb_response: fbResult,
          });
        } else {
          console.log(`Successfully sent event for ${submission.id}:`, fbResult);
          results.push({
            id: submission.id,
            success: true,
            fb_response: fbResult,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`Error processing submission ${submission.id}:`, error);
        results.push({
          id: submission.id,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Backfill complete: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Backfill complete",
        total: submissions.length,
        success: successCount,
        failed: failCount,
        results,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in backfill-fb-events function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
