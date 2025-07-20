-- Create error logging table for client-side error tracking
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for querying error logs
CREATE INDEX idx_error_logs_timestamp ON public.error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_message ON public.error_logs(message);
CREATE INDEX idx_error_logs_url ON public.error_logs(url);

-- Enable RLS on error logs
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for error logs
-- Only service role can read/write error logs for security
CREATE POLICY "Service role can manage error logs" ON public.error_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.error_logs TO service_role;

-- Create function to clean up old error logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_errors BIGINT,
  unique_messages BIGINT,
  top_errors JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_errors,
    COUNT(DISTINCT message) as unique_messages,
    jsonb_agg(
      jsonb_build_object(
        'message', message,
        'count', count,
        'latest_occurrence', latest_occurrence
      )
    ) as top_errors
  FROM (
    SELECT 
      message,
      COUNT(*) as count,
      MAX(timestamp) as latest_occurrence
    FROM public.error_logs
    WHERE timestamp BETWEEN start_date AND end_date
    GROUP BY message
    ORDER BY COUNT(*) DESC
    LIMIT 10
  ) top_errors_subquery;
END;
$$ LANGUAGE plpgsql;