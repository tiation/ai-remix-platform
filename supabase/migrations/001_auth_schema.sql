-- Create auth schema and tables for GoTrue
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table
CREATE TABLE auth.users (
    instance_id UUID,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aud VARCHAR(255),
    role VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    invited_at TIMESTAMP WITH TIME ZONE,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMP WITH TIME ZONE,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMP WITH TIME ZONE,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    is_super_admin BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone VARCHAR(15) DEFAULT NULL::character varying UNIQUE,
    phone_confirmed_at TIMESTAMP WITH TIME ZONE,
    phone_change VARCHAR(15) DEFAULT ''::character varying,
    phone_change_token VARCHAR(255) DEFAULT ''::character varying,
    phone_change_sent_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current VARCHAR(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until TIMESTAMP WITH TIME ZONE,
    reauthentication_token VARCHAR(255) DEFAULT ''::character varying,
    reauthentication_sent_at TIMESTAMP WITH TIME ZONE,
    is_sso_user boolean NOT NULL DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for auth.users
CREATE INDEX users_instance_id_idx ON auth.users(instance_id);
CREATE INDEX users_instance_id_email_idx ON auth.users(instance_id, email);
CREATE INDEX users_email_partial_key ON auth.users(email) WHERE is_sso_user = false;
CREATE UNIQUE INDEX confirmation_token_idx ON auth.users(confirmation_token) WHERE confirmation_token IS NOT NULL;
CREATE UNIQUE INDEX recovery_token_idx ON auth.users(recovery_token) WHERE recovery_token IS NOT NULL;
CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users(email_change_token_current) WHERE email_change_token_current != '';
CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users(email_change_token_new) WHERE email_change_token_new != '';
CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users(reauthentication_token) WHERE reauthentication_token != '';
CREATE UNIQUE INDEX users_phone_partial_key ON auth.users(phone) WHERE phone IS NOT NULL AND is_sso_user = false;

-- Create auth.refresh_tokens table
CREATE TABLE auth.refresh_tokens (
    instance_id UUID,
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    revoked BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent VARCHAR(255),
    session_id UUID
);

-- Create indexes for auth.refresh_tokens
CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens(instance_id);
CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens(instance_id, user_id);
CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens(parent);
CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens(session_id, revoked);
CREATE UNIQUE INDEX refresh_tokens_token_unique ON auth.refresh_tokens(token);

-- Create auth.instances table
CREATE TABLE auth.instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid UUID,
    raw_base_config TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create auth.audit_log_entries table
CREATE TABLE auth.audit_log_entries (
    instance_id UUID,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(64) NOT NULL DEFAULT ''::character varying
);

-- Create indexes for auth.audit_log_entries
CREATE INDEX audit_log_entries_instance_id_idx ON auth.audit_log_entries(instance_id);

-- Create auth.schema_migrations table
CREATE TABLE auth.schema_migrations (
    version VARCHAR(255) PRIMARY KEY
);

-- Insert schema migration version
INSERT INTO auth.schema_migrations (version) VALUES ('20171026211738'), ('20171026211808'), ('20171026211834');

-- Create JWT functions and roles
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID 
LANGUAGE SQL STABLE
AS $$
  SELECT 
    COALESCE(
        NULLIF(current_setting('request.jwt.claim.sub', true), ''),
        (NULLIF(current_setting('request.jwt.claims', true), '')::JSONB ->> 'sub')
    )::UUID
$$;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS TEXT 
LANGUAGE SQL STABLE
AS $$
  SELECT 
    COALESCE(
        NULLIF(current_setting('request.jwt.claim.role', true), ''),
        (NULLIF(current_setting('request.jwt.claims', true), '')::JSONB ->> 'role')
    )::TEXT
$$;

-- Create JWT roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOINHERIT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOINHERIT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOINHERIT BYPASSRLS;
    END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT SELECT ON auth.users TO service_role;
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON auth.refresh_tokens TO service_role;
GRANT ALL ON auth.audit_log_entries TO service_role;
GRANT ALL ON auth.instances TO service_role;
GRANT ALL ON auth.schema_migrations TO service_role;