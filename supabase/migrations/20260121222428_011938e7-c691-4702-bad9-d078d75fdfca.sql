-- Create table for caching CSG API session tokens
CREATE TABLE public.csg_api_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS (service role access only via edge functions)
ALTER TABLE public.csg_api_tokens ENABLE ROW LEVEL SECURITY;

-- No policies needed - edge functions use service role key which bypasses RLS

-- Create submissions table for tracking all funnel submissions
CREATE TABLE public.submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Analytics IDs (optional - for enrichment)
  visitor_id text,
  session_id text,
  
  -- Form data
  plan text,
  current_payment numeric,
  care_or_condition text,
  recent_treatment text,
  medication_use text,
  gender text,
  tobacco text,
  spouse text,
  age integer,
  zip_code text,
  first_name text,
  last_name text,
  email text,
  phone text,
  
  -- Result data
  submission_type text NOT NULL, -- 'success', 'disqualified', 'knockout'
  disqualification_reason text,
  quoted_rate numeric,
  quoted_carrier text,
  am_best_rating text,
  monthly_savings numeric,
  annual_savings numeric,
  
  -- Metadata
  page text DEFAULT 'suppquote'
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (funnel submissions)
CREATE POLICY "Allow anonymous inserts for submissions"
  ON public.submissions FOR INSERT WITH CHECK (true);

-- Allow reading submissions (for analytics dashboard)
CREATE POLICY "Allow reading submissions"
  ON public.submissions FOR SELECT USING (true);