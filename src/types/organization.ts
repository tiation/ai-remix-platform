// Organization types for multi-tenant enterprise architecture

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  max_projects: number;
  max_ai_requests: number;
  max_members: number;
  billing_email?: string;
  stripe_customer_id?: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: Record<string, boolean>;
  invited_at?: string;
  joined_at: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
}

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  organization?: {
    name: string;
    slug: string;
  };
  inviter?: {
    username: string;
    email: string;
  };
}

export interface OrganizationUsage {
  id: string;
  organization_id: string;
  metric_name: 'projects_created' | 'ai_requests' | 'storage_used' | 'members';
  metric_value: number;
  period: string; // YYYY-MM format
  created_at: string;
  updated_at: string;
}

export interface OrganizationLimits {
  projects: {
    used: number;
    limit: number;
    percentage: number;
  };
  ai_requests: {
    used: number;
    limit: number;
    percentage: number;
  };
  members: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export interface CreateOrganizationRequest {
  name: string;
  slug?: string;
  plan?: 'starter' | 'pro' | 'enterprise';
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  billing_email?: string;
  settings?: Record<string, any>;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface UpdateMemberRequest {
  role: 'admin' | 'member' | 'viewer';
  permissions?: Record<string, boolean>;
}

// Plan configurations
export const ORGANIZATION_PLANS = {
  starter: {
    name: 'Starter',
    max_projects: 5,
    max_ai_requests: 50,
    max_members: 1,
    price: 0,
    features: [
      '5 projects',
      '50 AI requests/month',
      'Public gallery access',
      'Community support'
    ]
  },
  pro: {
    name: 'Pro',
    max_projects: 50,
    max_ai_requests: 1000,
    max_members: 10,
    price: 999, // $9.99 in cents
    features: [
      '50 projects',
      '1,000 AI requests/month',
      'Team collaboration',
      'Priority support',
      'Private projects',
      'Custom templates'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    max_projects: 500,
    max_ai_requests: 10000,
    max_members: 100,
    price: 2999, // $29.99 in cents
    features: [
      '500 projects',
      '10,000 AI requests/month',
      'Advanced team management',
      'SSO integration',
      'Audit logs',
      'Custom branding',
      'SLA support',
      'Dedicated success manager'
    ]
  }
} as const;

// Permission definitions
export const ORGANIZATION_PERMISSIONS = {
  // Project permissions
  'projects.create': 'Create new projects',
  'projects.read': 'View projects',
  'projects.update': 'Edit projects',
  'projects.delete': 'Delete projects',
  'projects.publish': 'Publish/unpublish projects',
  
  // Member permissions
  'members.invite': 'Invite new members',
  'members.manage': 'Manage member roles',
  'members.remove': 'Remove members',
  
  // Organization permissions
  'organization.settings': 'Manage organization settings',
  'organization.billing': 'Access billing information',
  'organization.analytics': 'View analytics and usage',
  
  // AI permissions
  'ai.use': 'Use AI features',
  'ai.configure': 'Configure AI settings'
} as const;

// Default role permissions
export const ROLE_PERMISSIONS: Record<OrganizationMember['role'], string[]> = {
  owner: Object.keys(ORGANIZATION_PERMISSIONS),
  admin: [
    'projects.create',
    'projects.read', 
    'projects.update',
    'projects.delete',
    'projects.publish',
    'members.invite',
    'members.manage',
    'members.remove',
    'organization.settings',
    'organization.analytics',
    'ai.use',
    'ai.configure'
  ],
  member: [
    'projects.create',
    'projects.read',
    'projects.update',
    'projects.publish',
    'ai.use'
  ],
  viewer: [
    'projects.read'
  ]
};

// Utility types for API responses
export interface OrganizationWithMembers extends Organization {
  members: OrganizationMember[];
  member_count: number;
  usage: OrganizationUsage[];
  limits: OrganizationLimits;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  member_count: number;
  project_count: number;
  role: OrganizationMember['role'];
}