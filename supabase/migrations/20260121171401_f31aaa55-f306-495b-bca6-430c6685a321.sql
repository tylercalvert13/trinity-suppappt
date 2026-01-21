-- Add SELECT policy for funnel_sessions
CREATE POLICY "Allow reading funnel sessions"
  ON public.funnel_sessions
  FOR SELECT
  USING (true);

-- Add SELECT policy for funnel_events  
CREATE POLICY "Allow reading funnel events"
  ON public.funnel_events
  FOR SELECT
  USING (true);