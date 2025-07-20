-- Create billing and revenue tracking tables for ChaseWhiteRabbit NGO
-- This supports the 30% revenue allocation to NGO mission

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL, -- active, canceled, past_due, etc.
  plan_id TEXT NOT NULL, -- Stripe price ID
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_amount INTEGER, -- Amount in cents
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NGO revenue allocation tracking table
CREATE TABLE public.ngo_revenue_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id TEXT NOT NULL,
  total_amount INTEGER NOT NULL, -- Total subscription amount in cents
  ngo_allocation INTEGER NOT NULL, -- Amount allocated to NGO (30%)
  operational_allocation INTEGER NOT NULL, -- Amount for operations (70%)
  allocation_percentage DECIMAL DEFAULT 30.0, -- Percentage to NGO
  beneficiary_org TEXT DEFAULT 'ChaseWhiteRabbit',
  purpose TEXT DEFAULT 'AI tools for social impact organizations',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NGO revenue log for payment tracking
CREATE TABLE public.ngo_revenue_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT NOT NULL,
  subscription_id TEXT,
  customer_id TEXT,
  amount_paid INTEGER NOT NULL, -- Amount paid in cents
  currency TEXT DEFAULT 'usd',
  payment_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment failures tracking
CREATE TABLE public.payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT NOT NULL,
  subscription_id TEXT,
  customer_id TEXT,
  amount INTEGER NOT NULL, -- Failed amount in cents
  currency TEXT DEFAULT 'usd',
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user notifications table
CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- payment_failed, subscription_updated, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user API usage tracking for billing
CREATE TABLE public.user_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  api_type TEXT NOT NULL, -- claude_api, etc.
  requests_count INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  month_year TEXT NOT NULL, -- Format: 2024-01
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, api_type, month_year)
);

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_ngo_revenue_allocation_subscription ON public.ngo_revenue_allocation(subscription_id);
CREATE INDEX idx_ngo_revenue_log_payment_date ON public.ngo_revenue_log(payment_date DESC);
CREATE INDEX idx_payment_failures_created_at ON public.payment_failures(created_at DESC);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications(user_id, read_at);
CREATE INDEX idx_user_api_usage_user_month ON public.user_api_usage(user_id, month_year);

-- Create functions for usage tracking
CREATE OR REPLACE FUNCTION increment_api_usage(
  p_user_id UUID,
  p_api_type TEXT,
  p_requests INTEGER DEFAULT 1,
  p_tokens INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO public.user_api_usage (user_id, api_type, month_year, requests_count, tokens_used)
  VALUES (p_user_id, p_api_type, current_month, p_requests, p_tokens)
  ON CONFLICT (user_id, api_type, month_year)
  DO UPDATE SET
    requests_count = user_api_usage.requests_count + p_requests,
    tokens_used = user_api_usage.tokens_used + p_tokens,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get user's current subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  subscription_status TEXT;
BEGIN
  SELECT status INTO subscription_status
  FROM public.user_subscriptions
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF subscription_status IS NULL THEN
    RETURN 'free';
  ELSE
    RETURN 'paid';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to check API usage limits
CREATE OR REPLACE FUNCTION check_api_usage_limit(
  p_user_id UUID,
  p_api_type TEXT,
  p_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  current_usage INTEGER := 0;
BEGIN
  SELECT requests_count INTO current_usage
  FROM public.user_api_usage
  WHERE user_id = p_user_id 
    AND api_type = p_api_type 
    AND month_year = current_month;
  
  IF current_usage IS NULL THEN
    current_usage := 0;
  END IF;
  
  RETURN current_usage < p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for user_api_usage
CREATE TRIGGER update_user_api_usage_updated_at 
  BEFORE UPDATE ON public.user_api_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_revenue_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_revenue_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for billing tables
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own notifications" ON public.user_notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own API usage" ON public.user_api_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage API usage" ON public.user_api_usage
  FOR ALL USING (auth.role() = 'service_role');

-- NGO revenue tables are service_role only for security
CREATE POLICY "Service role only for NGO revenue" ON public.ngo_revenue_allocation
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for revenue log" ON public.ngo_revenue_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only for payment failures" ON public.payment_failures
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.user_subscriptions TO service_role;
GRANT ALL ON public.ngo_revenue_allocation TO service_role;
GRANT ALL ON public.ngo_revenue_log TO service_role;
GRANT ALL ON public.payment_failures TO service_role;
GRANT ALL ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_api_usage TO service_role;
GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT SELECT ON public.user_notifications TO authenticated;
GRANT SELECT ON public.user_api_usage TO authenticated;

-- Insert sample pricing tiers for reference
INSERT INTO public.user_subscriptions (user_id, stripe_subscription_id, status, plan_id)
VALUES 
  ('00000000-0000-0000-0000-000000000000'::UUID, 'sample_free', 'active', 'price_free'),
  ('00000000-0000-0000-0000-000000000001'::UUID, 'sample_pro', 'active', 'price_pro_999'),
  ('00000000-0000-0000-0000-000000000002'::UUID, 'sample_team', 'active', 'price_team_2999')
ON CONFLICT DO NOTHING;