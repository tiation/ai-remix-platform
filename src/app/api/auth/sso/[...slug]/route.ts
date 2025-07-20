import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SSOProvider, SAMLRequest, OIDCTokenResponse } from '@/types/sso';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SSO authentication handler
// Supports both SAML and OIDC flows
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const [action, organizationSlug, providerSlug] = params.slug;

  try {
    switch (action) {
      case 'login':
        return handleSSOLogin(request, organizationSlug, providerSlug);
      case 'callback':
        return handleSSOCallback(request, organizationSlug, providerSlug);
      case 'metadata':
        return handleSAMLMetadata(request, organizationSlug, providerSlug);
      case 'logout':
        return handleSSOLogout(request, organizationSlug, providerSlug);
      default:
        return NextResponse.json(
          { error: 'Invalid SSO action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('SSO handler error:', error);
    return NextResponse.json(
      { error: 'SSO authentication failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const [action, organizationSlug, providerSlug] = params.slug;

  try {
    switch (action) {
      case 'callback':
        return handleSSOCallback(request, organizationSlug, providerSlug);
      default:
        return NextResponse.json(
          { error: 'Invalid SSO POST action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('SSO POST handler error:', error);
    return NextResponse.json(
      { error: 'SSO authentication failed', details: error.message },
      { status: 500 }
    );
  }
}

async function handleSSOLogin(
  request: NextRequest,
  organizationSlug: string,
  providerSlug: string
) {
  // Get SSO provider configuration
  const { data: providerData, error: providerError } = await supabase
    .rpc('get_sso_provider', {
      p_organization_slug: organizationSlug,
      p_provider_slug: providerSlug
    })
    .single();

  if (providerError || !providerData) {
    return NextResponse.json(
      { error: 'SSO provider not found or not enabled' },
      { status: 404 }
    );
  }

  const provider = providerData as any;
  const redirectUrl = request.nextUrl.searchParams.get('redirect_url') || '/dashboard';
  const state = generateState();

  // Store state in session for CSRF protection
  const sessionData = {
    state,
    provider_id: provider.provider_id,
    organization_id: provider.organization_id,
    redirect_url: redirectUrl,
    created_at: new Date().toISOString()
  };

  if (provider.provider_type === 'saml') {
    return handleSAMLLogin(provider, state, sessionData);
  } else if (provider.provider_type === 'oidc') {
    return handleOIDCLogin(provider, state, sessionData);
  } else {
    return NextResponse.json(
      { error: 'Unsupported SSO provider type' },
      { status: 400 }
    );
  }
}

async function handleSAMLLogin(
  provider: any,
  state: string,
  sessionData: any
) {
  const config = provider.provider_config;
  
  // Generate SAML AuthnRequest
  const authnRequest = generateSAMLAuthnRequest(
    config.entity_id,
    config.sso_url,
    `${process.env.NEXTAUTH_URL}/api/auth/sso/callback/${provider.organization_id}/${provider.provider_id}`,
    config.name_id_format || 'email'
  );

  // In production, you would use a proper SAML library like saml2-js
  // This is a simplified mock implementation
  const samlRequest = Buffer.from(authnRequest.xml).toString('base64');
  
  const redirectUrl = new URL(config.sso_url);
  redirectUrl.searchParams.set('SAMLRequest', samlRequest);
  redirectUrl.searchParams.set('RelayState', state);
  redirectUrl.searchParams.set('SigAlg', 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256');

  // Store session data (in production, use secure session storage)
  // For now, we'll use a mock approach
  
  return NextResponse.redirect(redirectUrl.toString());
}

async function handleOIDCLogin(
  provider: any,
  state: string,
  sessionData: any
) {
  const config = provider.provider_config;
  
  // Build OIDC authorization URL
  const authUrl = new URL(config.authorization_endpoint);
  authUrl.searchParams.set('client_id', config.client_id);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', config.scopes?.join(' ') || 'openid email profile');
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/sso/callback/${provider.organization_id}/${provider.provider_id}`);
  authUrl.searchParams.set('state', state);
  
  // Add PKCE for enhanced security (optional but recommended)
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  
  // Store session data including PKCE verifier
  sessionData.code_verifier = codeVerifier;
  
  return NextResponse.redirect(authUrl.toString());
}

async function handleSSOCallback(
  request: NextRequest,
  organizationSlug: string,
  providerSlug: string
) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  const samlResponse = url.searchParams.get('SAMLResponse');
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`/auth/error?error=${encodeURIComponent(error)}`);
  }

  if (!state) {
    return NextResponse.redirect('/auth/error?error=missing_state');
  }

  // Get provider configuration
  const { data: providerData, error: providerError } = await supabase
    .rpc('get_sso_provider', {
      p_organization_slug: organizationSlug,
      p_provider_slug: providerSlug
    })
    .single();

  if (providerError || !providerData) {
    return NextResponse.redirect('/auth/error?error=provider_not_found');
  }

  const provider = providerData as any;

  try {
    let userInfo: any;

    if (provider.provider_type === 'saml' && samlResponse) {
      userInfo = await processSAMLResponse(provider, samlResponse, state);
    } else if (provider.provider_type === 'oidc' && code) {
      userInfo = await processOIDCCallback(provider, code, state);
    } else {
      throw new Error('Invalid callback parameters');
    }

    // Provision or update user
    const { data: userId, error: provisionError } = await supabase
      .rpc('provision_sso_user', {
        p_provider_id: provider.provider_id,
        p_provider_user_id: userInfo.id,
        p_email: userInfo.email,
        p_first_name: userInfo.first_name,
        p_last_name: userInfo.last_name,
        p_display_name: userInfo.display_name,
        p_groups: userInfo.groups || [],
        p_attributes: userInfo.attributes || {}
      });

    if (provisionError) {
      throw provisionError;
    }

    // Create SSO session
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + 8); // 8 hours default

    await supabase
      .from('sso_sessions')
      .insert({
        user_id: userId,
        provider_id: provider.provider_id,
        session_id: generateSessionId(),
        expires_at: sessionExpiry.toISOString()
      });

    // Log successful login
    await supabase
      .from('sso_audit_logs')
      .insert({
        organization_id: provider.organization_id,
        provider_id: provider.provider_id,
        user_id: userId,
        event_type: 'login_success',
        details: {
          email: userInfo.email,
          login_method: provider.provider_type
        },
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent')
      });

    // Create Supabase session (simplified - in production use GoTrue API)
    const redirectUrl = '/dashboard'; // Default redirect
    
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}${redirectUrl}`);

  } catch (error: any) {
    console.error('SSO callback processing error:', error);
    
    // Log failed login
    await supabase
      .from('sso_audit_logs')
      .insert({
        organization_id: provider.organization_id,
        provider_id: provider.provider_id,
        event_type: 'login_failed',
        details: {
          error: error.message,
          login_method: provider.provider_type
        },
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent')
      });

    return NextResponse.redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }
}

async function handleSAMLMetadata(
  request: NextRequest,
  organizationSlug: string,
  providerSlug: string
) {
  // Return SAML SP metadata for IdP configuration
  const entityId = `${process.env.NEXTAUTH_URL}/api/auth/sso/metadata/${organizationSlug}/${providerSlug}`;
  const acsUrl = `${process.env.NEXTAUTH_URL}/api/auth/sso/callback/${organizationSlug}/${providerSlug}`;

  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService index="0" isDefault="true" 
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" 
      Location="${acsUrl}"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

  return new NextResponse(metadata, {
    headers: {
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="saml-metadata-${organizationSlug}-${providerSlug}.xml"`
    }
  });
}

async function handleSSOLogout(
  request: NextRequest,
  organizationSlug: string,
  providerSlug: string
) {
  // Implement SSO logout (SLO for SAML, logout for OIDC)
  // This is a simplified implementation
  
  return NextResponse.redirect('/auth/logout?sso=true');
}

// Helper functions (mock implementations)
function generateState(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

function generateSessionId(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
}

function generateCodeVerifier(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(digest).toString('base64url');
}

function generateSAMLAuthnRequest(
  entityId: string,
  ssoUrl: string,
  acsUrl: string,
  nameIdFormat: string
): { id: string; xml: string } {
  const id = `_${generateSessionId()}`;
  const timestamp = new Date().toISOString();
  
  const xml = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" 
    ID="${id}" Version="2.0" IssueInstant="${timestamp}" 
    Destination="${ssoUrl}" AssertionConsumerServiceURL="${acsUrl}">
    <saml:Issuer>${entityId}</saml:Issuer>
    <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:${nameIdFormat}" AllowCreate="true"/>
  </samlp:AuthnRequest>`;

  return { id, xml };
}

async function processSAMLResponse(provider: any, samlResponse: string, state: string): Promise<any> {
  // In production, use a proper SAML library to parse and validate the response
  // This is a mock implementation
  const decoded = Buffer.from(samlResponse, 'base64').toString('utf-8');
  
  // Mock user info extraction (in production, properly parse SAML assertion)
  return {
    id: 'mock-saml-user-id',
    email: 'user@example.com',
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'John Doe',
    groups: ['employees', 'developers'],
    attributes: {}
  };
}

async function processOIDCCallback(provider: any, code: string, state: string): Promise<any> {
  const config = provider.provider_config;
  
  // Exchange authorization code for tokens
  const tokenResponse = await fetch(config.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.client_id,
      client_secret: config.client_secret,
      code: code,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/sso/callback/${provider.organization_id}/${provider.provider_id}`
    })
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange authorization code for tokens');
  }

  const tokens: OIDCTokenResponse = await tokenResponse.json();

  // Get user info
  const userInfoResponse = await fetch(config.userinfo_endpoint, {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`
    }
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch user information');
  }

  const userInfo = await userInfoResponse.json();
  const claimMapping = config.claim_mapping || {};

  return {
    id: userInfo.sub,
    email: userInfo[claimMapping.email] || userInfo.email,
    first_name: userInfo[claimMapping.first_name] || userInfo.given_name,
    last_name: userInfo[claimMapping.last_name] || userInfo.family_name,
    display_name: userInfo[claimMapping.display_name] || userInfo.name,
    groups: userInfo[claimMapping.groups] || userInfo.groups || [],
    attributes: userInfo
  };
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}