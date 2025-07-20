-- Multi-tenant organization model for enterprise customers
-- Enables proper resource isolation and billing separation

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  plan TEXT NOT NULL DEFAULT 'starter', -- starter, pro, enterprise
  max_projects INTEGER DEFAULT 5,
  max_ai_requests INTEGER DEFAULT 50, -- per month
  max_members INTEGER DEFAULT 1,
  billing_email TEXT,
  stripe_customer_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization members table  
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  permissions JSONB DEFAULT '{}', -- Custom permissions per member
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create organization invites table
CREATE TABLE public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization usage tracking
CREATE TABLE public.organization_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL, -- projects_created, ai_requests, storage_used
  metric_value INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL, -- format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, metric_name, period)
);

-- Update projects table to be organization-aware
ALTER TABLE public.projects 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update users table with default organization
ALTER TABLE public.users 
ADD COLUMN default_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_plan ON public.organizations(plan);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_role ON public.organization_members(role);
CREATE INDEX idx_organization_invites_email ON public.organization_invites(email);
CREATE INDEX idx_organization_invites_token ON public.organization_invites(token);
CREATE INDEX idx_organization_invites_expires ON public.organization_invites(expires_at);
CREATE INDEX idx_organization_usage_org_period ON public.organization_usage(organization_id, period);
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);

-- Create functions for organization management

-- Function to create organization with owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  owner_id UUID,
  plan_type TEXT DEFAULT 'starter'
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Insert organization
  INSERT INTO public.organizations (name, slug, plan, max_projects, max_ai_requests, max_members)
  VALUES (
    org_name, 
    org_slug, 
    plan_type,
    CASE plan_type 
      WHEN 'pro' THEN 50
      WHEN 'enterprise' THEN 500
      ELSE 5
    END,
    CASE plan_type
      WHEN 'pro' THEN 1000
      WHEN 'enterprise' THEN 10000  
      ELSE 50
    END,
    CASE plan_type
      WHEN 'pro' THEN 10
      WHEN 'enterprise' THEN 100
      ELSE 1
    END
  )
  RETURNING id INTO new_org_id;
  
  -- Add owner as organization member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, owner_id, 'owner');
  
  -- Set as user's default organization
  UPDATE public.users 
  SET default_organization_id = new_org_id 
  WHERE id = owner_id;
  
  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check organization limits
CREATE OR REPLACE FUNCTION check_organization_limit(
  org_id UUID,
  limit_type TEXT -- 'projects', 'ai_requests', 'members'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  current_period TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  -- Get organization limits
  SELECT 
    CASE limit_type
      WHEN 'projects' THEN max_projects
      WHEN 'ai_requests' THEN max_ai_requests  
      WHEN 'members' THEN max_members
    END
  INTO max_allowed
  FROM public.organizations
  WHERE id = org_id;
  
  -- Get current usage
  IF limit_type = 'projects' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.projects  
    WHERE organization_id = org_id;
  ELSIF limit_type = 'members' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.organization_members
    WHERE organization_id = org_id;
  ELSIF limit_type = 'ai_requests' THEN
    SELECT COALESCE(metric_value, 0) INTO current_count
    FROM public.organization_usage
    WHERE organization_id = org_id 
      AND metric_name = 'ai_requests'
      AND period = current_period;
  END IF;
  
  RETURN COALESCE(current_count, 0) < COALESCE(max_allowed, 999999);
END;
$$ LANGUAGE plpgsql;

-- Function to increment organization usage
CREATE OR REPLACE FUNCTION increment_organization_usage(
  org_id UUID,
  metric TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_period TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO public.organization_usage (organization_id, metric_name, metric_value, period)
  VALUES (org_id, metric, increment_by, current_period)
  ON CONFLICT (organization_id, metric_name, period)
  DO UPDATE SET 
    metric_value = organization_usage.metric_value + increment_by,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_usage_updated_at 
  BEFORE UPDATE ON public.organization_usage  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Organizations: Members can view their organizations
CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Organizations: Owners and admins can update
CREATE POLICY "Owners and admins can update organizations" ON public.organizations  
  FOR UPDATE USING (
    id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Organization members: Members can view other members
CREATE POLICY "Members can view organization members" ON public.organization_members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Organization members: Owners and admins can manage members
CREATE POLICY "Owners and admins can manage members" ON public.organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Organization invites: Members can view invites for their orgs
CREATE POLICY "Members can view organization invites" ON public.organization_invites
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Organization usage: Members can view usage for their orgs
CREATE POLICY "Members can view organization usage" ON public.organization_usage
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Service role policies for all tables
CREATE POLICY "Service role full access orgs" ON public.organizations
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "Service role full access members" ON public.organization_members  
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "Service role full access invites" ON public.organization_invites
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "Service role full access usage" ON public.organization_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Update projects RLS to include organization context
DROP POLICY "Projects are viewable by everyone if public" ON public.projects;
DROP POLICY "Users can create projects" ON public.projects;  
DROP POLICY "Users can update their own projects" ON public.projects;
DROP POLICY "Users can delete their own projects" ON public.projects;

-- New organization-aware project policies
CREATE POLICY "Projects are viewable if public or user is org member" ON public.projects
  FOR SELECT USING (
    is_public = true OR 
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their organizations" ON public.projects
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their organizations" ON public.projects  
  FOR UPDATE USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')  
    )
  );

CREATE POLICY "Users can delete their own projects or org admins" ON public.projects
  FOR DELETE USING (
    user_id = auth.uid() OR  
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Grant permissions
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.organization_members TO service_role;
GRANT ALL ON public.organization_invites TO service_role; 
GRANT ALL ON public.organization_usage TO service_role;

GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.organization_members TO authenticated;
GRANT SELECT ON public.organization_invites TO authenticated;
GRANT SELECT ON public.organization_usage TO authenticated;

-- Create default organization for existing users
DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
BEGIN
  FOR user_record IN SELECT id, username, email FROM public.users LOOP
    -- Create personal organization for each existing user
    SELECT create_organization_with_owner(
      user_record.username || '''s Organization',
      user_record.username || '-org', 
      user_record.id,
      'starter'
    ) INTO new_org_id;
    
    -- Update existing projects to belong to their personal organization
    UPDATE public.projects 
    SET organization_id = new_org_id
    WHERE user_id = user_record.id AND organization_id IS NULL;
  END LOOP;
END $$;