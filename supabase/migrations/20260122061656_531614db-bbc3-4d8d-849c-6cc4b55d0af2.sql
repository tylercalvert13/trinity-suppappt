-- Enable real-time for submissions table to show quote notifications live
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;