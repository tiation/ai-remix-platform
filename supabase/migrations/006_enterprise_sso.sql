-- Enterprise SSO integration schema for SAML and OIDC
-- Enables enterprise customers to use their identity providers

-- Create SSO providers table
CREATE TABLE public.sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('saml', 'oidc')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly identifier
  enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Create SSO users table to map external identities
CREATE TABLE public.sso_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  provider_user_id TEXT NOT NULL, -- Unique ID from SSO provider
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  groups TEXT[] DEFAULT '{}',
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, provider_user_id)
);

-- Create SSO sessions for tracking active sessions
CREATE TABLE public.sso_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Provider session ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  UNIQUE(provider_id, session_id)
);

-- Create SSO group mappings for role assignment
CREATE TABLE public.sso_group_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE CASCADE,
  sso_group TEXT NOT NULL, -- Group name from SSO provider
  organization_role TEXT NOT NULL CHECK (organization_role IN ('owner', 'admin', 'member', 'viewer')),
  auto_provision BOOLEAN DEFAULT true, -- Auto-add users to organization
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, sso_group)
);

-- Create SSO audit log for compliance and debugging
CREATE TABLE public.sso_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.sso_providers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'config_created',
    'config_updated', 
    'config_deleted',
    'login_success',
    'login_failed',
    'logout',
    'user_provisioned',
    'user_updated',
    'group_sync'
  )),
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enterprise settings for SSO requirements
CREATE TABLE public.enterprise_settings (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  sso_required BOOLEAN DEFAULT false, -- Force all users to use SSO
  allow_password_login BOOLEAN DEFAULT true, -- Allow fallback to password
  session_timeout INTEGER DEFAULT 480, -- Minutes (8 hours)
  require_mfa BOOLEAN DEFAULT false,
  allowed_domains TEXT[] DEFAULT '{}', -- Email domains that can access
  auto_provision_users BOOLEAN DEFAULT true,
  default_role TEXT DEFAULT 'member' CHECK (default_role IN ('admin', 'member', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sso_providers_org_id ON public.sso_providers(organization_id);
CREATE INDEX idx_sso_providers_slug ON public.sso_providers(organization_id, slug);
CREATE INDEX idx_sso_providers_enabled ON public.sso_providers(enabled) WHERE enabled = true;

CREATE INDEX idx_sso_users_user_id ON public.sso_users(user_id);
CREATE INDEX idx_sso_users_provider_id ON public.sso_users(provider_id);
CREATE INDEX idx_sso_users_email ON public.sso_users(email);
CREATE INDEX idx_sso_users_last_login ON public.sso_users(last_login_at DESC);

CREATE INDEX idx_sso_sessions_user_id ON public.sso_sessions(user_id);
CREATE INDEX idx_sso_sessions_provider_id ON public.sso_sessions(provider_id);
CREATE INDEX idx_sso_sessions_expires ON public.sso_sessions(expires_at);
CREATE INDEX idx_sso_sessions_last_accessed ON public.sso_sessions(last_accessed_at);

CREATE INDEX idx_sso_group_mappings_org_id ON public.sso_group_mappings(organization_id);
CREATE INDEX idx_sso_group_mappings_provider_id ON public.sso_group_mappings(provider_id);

CREATE INDEX idx_sso_audit_logs_org_id ON public.sso_audit_logs(organization_id);
CREATE INDEX idx_sso_audit_logs_event_type ON public.sso_audit_logs(event_type);
CREATE INDEX idx_sso_audit_logs_created_at ON public.sso_audit_logs(created_at DESC);

-- Create functions for SSO management

-- Function to create SSO provider
CREATE OR REPLACE FUNCTION create_sso_provider(
  p_organization_id UUID,
  p_type TEXT,
  p_name TEXT,
  p_slug TEXT,
  p_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_provider_id UUID;
BEGIN
  -- Validate input
  IF p_type NOT IN ('saml', 'oidc') THEN
    RAISE EXCEPTION 'Invalid SSO provider type: %', p_type;
  END IF;
  
  IF LENGTH(p_name) < 2 OR LENGTH(p_name) > 100 THEN
    RAISE EXCEPTION 'Provider name must be between 2 and 100 characters';
  END IF;
  
  IF LENGTH(p_slug) < 2 OR LENGTH(p_slug) > 50 THEN
    RAISE EXCEPTION 'Provider slug must be between 2 and 50 characters';
  END IF;
  
  -- Insert the provider
  INSERT INTO public.sso_providers (
    organization_id,
    type,
    name,
    slug,
    config,
    enabled
  ) VALUES (
    p_organization_id,
    p_type,
    p_name,
    p_slug,
    p_config,
    false -- Start disabled until configured
  ) RETURNING id INTO new_provider_id;
  
  -- Log the creation
  INSERT INTO public.sso_audit_logs (
    organization_id,
    provider_id,
    event_type,
    details
  ) VALUES (
    p_organization_id,
    new_provider_id,
    'config_created',
    jsonb_build_object(
      'provider_type', p_type,
      'provider_name', p_name,
      'provider_slug', p_slug
    )
  );
  
  RETURN new_provider_id;
END;
$$ LANGUAGE plpgsql;

-- Function to provision SSO user
CREATE OR REPLACE FUNCTION provision_sso_user(
  p_provider_id UUID,
  p_provider_user_id TEXT,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_groups TEXT[] DEFAULT '{}',
  p_attributes JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  auth_user_id UUID;
  sso_user_id UUID;
  provider_org_id UUID;
  enterprise_settings RECORD;
  user_role TEXT := 'member';
BEGIN
  -- Get provider organization
  SELECT organization_id INTO provider_org_id
  FROM public.sso_providers
  WHERE id = p_provider_id;
  
  IF provider_org_id IS NULL THEN
    RAISE EXCEPTION 'SSO provider not found';
  END IF;
  
  -- Get enterprise settings
  SELECT * INTO enterprise_settings
  FROM public.enterprise_settings
  WHERE organization_id = provider_org_id;
  
  -- Check if user already exists in auth.users
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = p_email;
  
  -- If user doesn't exist, create them (if auto-provisioning is enabled)
  IF auth_user_id IS NULL THEN
    IF enterprise_settings.auto_provision_users THEN
      -- Create user in auth.users (simplified - in production use proper GoTrue API)
      INSERT INTO auth.users (
        id,
        email,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data
      ) VALUES (
        gen_random_uuid(),
        p_email,
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
          'first_name', p_first_name,
          'last_name', p_last_name,
          'display_name', p_display_name,
          'sso_provisioned', true
        )
      ) RETURNING id INTO auth_user_id;
      
      -- Create user profile
      INSERT INTO public.users (
        id,
        email,
        username
      ) VALUES (
        auth_user_id,
        p_email,
        COALESCE(p_display_name, split_part(p_email, '@', 1))
      );
    ELSE
      RAISE EXCEPTION 'User auto-provisioning is disabled for this organization';
    END IF;
  END IF;
  
  -- Upsert SSO user record
  INSERT INTO public.sso_users (
    user_id,
    provider_id,
    provider_user_id,
    email,
    first_name,
    last_name,
    display_name,
    groups,
    attributes,
    last_login_at
  ) VALUES (
    auth_user_id,
    p_provider_id,
    p_provider_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_display_name,
    p_groups,
    p_attributes,
    NOW()
  )
  ON CONFLICT (provider_id, provider_user_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    groups = EXCLUDED.groups,
    attributes = EXCLUDED.attributes,
    last_login_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO sso_user_id;
  
  -- Determine user role based on group mappings
  SELECT organization_role INTO user_role
  FROM public.sso_group_mappings sgm
  WHERE sgm.provider_id = p_provider_id
    AND sgm.sso_group = ANY(p_groups)
    AND sgm.auto_provision = true
  ORDER BY 
    CASE sgm.organization_role
      WHEN 'owner' THEN 4
      WHEN 'admin' THEN 3
      WHEN 'member' THEN 2
      WHEN 'viewer' THEN 1
    END DESC
  LIMIT 1;
  
  -- Use default role if no group mapping found
  IF user_role IS NULL THEN
    user_role := COALESCE(enterprise_settings.default_role, 'member');
  END IF;
  
  -- Add user to organization if not already a member
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    provider_org_id,
    auth_user_id,
    user_role
  )
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();
  
  -- Log the provisioning
  INSERT INTO public.sso_audit_logs (
    organization_id,
    provider_id,
    user_id,
    event_type,
    details
  ) VALUES (
    provider_org_id,
    p_provider_id,
    auth_user_id,
    'user_provisioned',
    jsonb_build_object(
      'email', p_email,
      'role', user_role,
      'groups', p_groups
    )
  );
  
  RETURN auth_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired SSO sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sso_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sso_sessions
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get SSO provider by organization and slug
CREATE OR REPLACE FUNCTION get_sso_provider(
  p_organization_slug TEXT,
  p_provider_slug TEXT
)
RETURNS TABLE (
  provider_id UUID,
  provider_type TEXT,
  provider_name TEXT,
  provider_config JSONB,
  organization_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.type,
    sp.name,
    sp.config,
    sp.organization_id
  FROM public.sso_providers sp
  JOIN public.organizations o ON sp.organization_id = o.id
  WHERE o.slug = p_organization_slug
    AND sp.slug = p_provider_slug
    AND sp.enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_sso_providers_updated_at 
  BEFORE UPDATE ON public.sso_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_users_updated_at 
  BEFORE UPDATE ON public.sso_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_group_mappings_updated_at 
  BEFORE UPDATE ON public.sso_group_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enterprise_settings_updated_at 
  BEFORE UPDATE ON public.enterprise_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_group_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enterprise_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- SSO providers: Organization admins and owners can manage
CREATE POLICY "Organization admins can manage SSO providers" ON public.sso_providers
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- SSO users: Users can view their own SSO info, admins can view all
CREATE POLICY "Users can view their own SSO info" ON public.sso_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization admins can view SSO users" ON public.sso_users
  FOR SELECT USING (
    provider_id IN (
      SELECT sp.id
      FROM public.sso_providers sp
      JOIN public.organization_members om ON sp.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- SSO sessions: Users can view their own sessions
CREATE POLICY "Users can view their own SSO sessions" ON public.sso_sessions
  FOR SELECT USING (user_id = auth.uid());

-- SSO group mappings: Organization admins can manage
CREATE POLICY "Organization admins can manage group mappings" ON public.sso_group_mappings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- SSO audit logs: Organization admins can view
CREATE POLICY "Organization admins can view audit logs" ON public.sso_audit_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Enterprise settings: Organization admins can manage
CREATE POLICY "Organization admins can manage enterprise settings" ON public.enterprise_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Service role policies for all tables
CREATE POLICY "Service role full access sso_providers" ON public.sso_providers
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "Service role full access sso_users" ON public.sso_users  
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "Service role full access sso_sessions" ON public.sso_sessions
  FOR ALL USING (auth.role() = 'service_role');
  
CREATE POLICY "Service role full access sso_group_mappings" ON public.sso_group_mappings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access sso_audit_logs" ON public.sso_audit_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access enterprise_settings" ON public.enterprise_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON public.sso_providers TO service_role;
GRANT ALL ON public.sso_users TO service_role;
GRANT ALL ON public.sso_sessions TO service_role;
GRANT ALL ON public.sso_group_mappings TO service_role;
GRANT ALL ON public.sso_audit_logs TO service_role;
GRANT ALL ON public.enterprise_settings TO service_role;

GRANT SELECT ON public.sso_providers TO authenticated;
GRANT SELECT ON public.sso_users TO authenticated;
GRANT SELECT ON public.sso_sessions TO authenticated;
GRANT SELECT ON public.sso_group_mappings TO authenticated;
GRANT SELECT ON public.sso_audit_logs TO authenticated;
GRANT SELECT ON public.enterprise_settings TO authenticated;

-- Create a scheduled job to clean up expired sessions (if using pg_cron)
-- SELECT cron.schedule('cleanup-expired-sso-sessions', '0 0 * * *', 'SELECT cleanup_expired_sso_sessions();');