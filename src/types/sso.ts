// Enterprise SSO types for SAML and OIDC integration

export interface SAMLConfig {
  enabled: boolean;
  entity_id: string;
  sso_url: string;
  slo_url?: string; // Single Logout URL
  certificate: string; // X.509 certificate for signature verification
  issuer: string;
  name_id_format: 'email' | 'persistent' | 'transient';
  attribute_mapping: {
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    groups?: string;
  };
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface OIDCConfig {
  enabled: boolean;
  issuer_url: string;
  client_id: string;
  client_secret: string; // Encrypted in database
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  scopes: string[]; // e.g., ['openid', 'email', 'profile']
  claim_mapping: {
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    groups?: string;
  };
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface SSOProvider {
  id: string;
  organization_id: string;
  type: 'saml' | 'oidc';
  name: string;
  slug: string; // URL-friendly identifier
  enabled: boolean;
  config: SAMLConfig | OIDCConfig;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SSOSession {
  id: string;
  user_id: string;
  provider_id: string;
  session_id: string; // Provider session ID
  created_at: string;
  expires_at: string;
  last_accessed_at: string;
  metadata?: Record<string, any>;
}

export interface SSOUser {
  id: string;
  user_id: string; // Reference to auth.users
  provider_id: string;
  provider_user_id: string; // Unique identifier from SSO provider
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  groups?: string[];
  attributes?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

// SSO Request/Response types
export interface SAMLRequest {
  id: string;
  issuer: string;
  destination: string;
  assertion_consumer_service_url: string;
  name_id_format: string;
  created_at: string;
}

export interface SAMLResponse {
  id: string;
  in_response_to: string;
  issuer: string;
  status: 'success' | 'requester_error' | 'responder_error';
  assertion?: {
    subject: {
      name_id: string;
      format: string;
    };
    attributes: Record<string, string | string[]>;
    conditions: {
      not_before: string;
      not_on_or_after: string;
      audience_restriction: string;
    };
  };
  signature_valid: boolean;
}

export interface OIDCTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope: string;
}

export interface OIDCUserInfo {
  sub: string; // Subject identifier
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  groups?: string[];
  [key: string]: any; // Additional custom claims
}

// Configuration validation types
export interface SSOConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  connectivity_check?: {
    metadata_accessible: boolean;
    certificate_valid: boolean;
    endpoints_reachable: boolean;
  };
}

// SSO login flow types
export interface SSOLoginRequest {
  provider_slug: string;
  organization_slug: string;
  redirect_url?: string;
  force_auth?: boolean;
}

export interface SSOLoginResponse {
  redirect_url: string;
  state: string; // CSRF protection
  session_id: string;
}

export interface SSOCallback {
  state: string;
  code?: string; // OIDC authorization code
  saml_response?: string; // Base64 encoded SAML response
  relay_state?: string;
  error?: string;
  error_description?: string;
}

// Group mapping for role assignment
export interface SSOGroupMapping {
  id: string;
  organization_id: string;
  provider_id: string;
  sso_group: string; // Group name from SSO provider
  organization_role: 'owner' | 'admin' | 'member' | 'viewer';
  auto_provision: boolean; // Automatically add users to organization
  created_at: string;
  updated_at: string;
}

// Audit log for SSO events
export interface SSOAuditLog {
  id: string;
  organization_id: string;
  provider_id?: string;
  user_id?: string;
  event_type: 
    | 'config_created'
    | 'config_updated' 
    | 'config_deleted'
    | 'login_success'
    | 'login_failed'
    | 'logout'
    | 'user_provisioned'
    | 'user_updated'
    | 'group_sync';
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

// Enterprise SSO settings
export interface EnterpriseSettings {
  organization_id: string;
  sso_required: boolean; // Force all users to use SSO
  allow_password_login: boolean; // Allow fallback to password
  session_timeout: number; // Minutes
  require_mfa: boolean;
  allowed_domains: string[]; // Email domains that can access
  auto_provision_users: boolean;
  default_role: 'admin' | 'member' | 'viewer';
  created_at: string;
  updated_at: string;
}

// Utility types for API responses
export interface SSOProviderSummary {
  id: string;
  name: string;
  type: 'saml' | 'oidc';
  enabled: boolean;
  user_count: number;
  last_used: string | null;
}

export interface SSOMetrics {
  total_providers: number;
  active_providers: number;
  total_sso_users: number;
  logins_last_30_days: number;
  success_rate: number;
  most_used_provider: string | null;
}