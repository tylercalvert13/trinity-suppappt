-- Create funnel_sessions table to track visitor sessions
CREATE TABLE public.funnel_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  page TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT NOT NULL DEFAULT 'desktop',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_step TEXT NOT NULL DEFAULT 'start',
  completed BOOLEAN NOT NULL DEFAULT false,
  called BOOLEAN NOT NULL DEFAULT false
);

-- Create funnel_events table to track individual events
CREATE TABLE public.funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  page TEXT NOT NULL,
  event_type TEXT NOT NULL,
  step TEXT,
  answer TEXT,
  outcome TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dashboard_users table for password-protected access
CREATE TABLE public.dashboard_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_funnel_sessions_visitor_id ON public.funnel_sessions(visitor_id);
CREATE INDEX idx_funnel_sessions_page ON public.funnel_sessions(page);
CREATE INDEX idx_funnel_sessions_started_at ON public.funnel_sessions(started_at);
CREATE INDEX idx_funnel_events_session_id ON public.funnel_events(session_id);
CREATE INDEX idx_funnel_events_page ON public.funnel_events(page);
CREATE INDEX idx_funnel_events_event_type ON public.funnel_events(event_type);
CREATE INDEX idx_funnel_events_created_at ON public.funnel_events(created_at);

-- Enable RLS
ALTER TABLE public.funnel_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_users ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (visitors aren't authenticated)
CREATE POLICY "Allow anonymous inserts for sessions" 
ON public.funnel_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow anonymous updates for sessions" 
ON public.funnel_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow anonymous inserts for events" 
ON public.funnel_events 
FOR INSERT 
WITH CHECK (true);

-- Dashboard users policies - read only for authenticated dashboard users
CREATE POLICY "Dashboard users can read their own data" 
ON public.dashboard_users 
FOR SELECT 
USING (true);

-- Enable realtime for live activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funnel_sessions;