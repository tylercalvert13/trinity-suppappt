import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for password comparison
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a simple session token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, action } = await req.json();

    console.log(`Analytics auth action: ${action} for email: ${email}`);

    if (action === 'login') {
      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('dashboard_users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !user) {
        console.log('User not found:', email);
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password
      const hashedPassword = await hashPassword(password);
      if (user.password_hash !== hashedPassword) {
        console.log('Invalid password for user:', email);
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate session token
      const token = generateToken();
      console.log('Login successful for:', email);

      return new Response(
        JSON.stringify({ success: true, token }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'register') {
      // Check if this is the first user (only allow registration if no users exist)
      const { count } = await supabase
        .from('dashboard_users')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Registration disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const { error: insertError } = await supabase
        .from('dashboard_users')
        .insert([{ email, password_hash: hashedPassword }]);

      if (insertError) {
        console.error('Error creating user:', insertError);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to create user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User registered:', email);
      return new Response(
        JSON.stringify({ success: true, message: 'User created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analytics-auth:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
