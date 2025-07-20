'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { OrganizationWithMembers, OrganizationMember } from '@/types/organization';
import { LoadingFallback } from '@/components/LoadingFallback';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Settings, 
  Users, 
  FolderOpen, 
  Zap, 
  TrendingUp,
  Plus,
  Crown,
  Shield,
  Eye,
  UserPlus,
  Calendar
} from 'lucide-react';

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: Users,
  viewer: Eye
};

const ROLE_COLORS = {
  owner: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  member: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
};

export default function OrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [organization, setOrganization] = useState<OrganizationWithMembers | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<OrganizationMember['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'members' | 'analytics'>('overview');

  useEffect(() => {
    if (slug) {
      loadOrganization();
    }
  }, [slug]);

  async function loadOrganization() {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/auth');
        return;
      }

      // Get organization with members and usage data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_members!inner (
            id,
            role,
            joined_at,
            user_id,
            users (
              username,
              email,
              avatar_url
            )
          ),
          organization_usage (
            metric_name,
            metric_value,
            period
          )
        `)
        .eq('slug', slug)
        .eq('organization_members.user_id', user.id)
        .single();

      if (orgError) {
        if (orgError.code === 'PGRST116') {
          setError('Organization not found or you do not have access to it.');
        } else {
          throw orgError;
        }
        return;
      }

      // Get all members for this organization
      const { data: allMembers, error: membersError } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          joined_at,
          user_id,
          users (
            username,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', orgData.id);

      if (membersError) throw membersError;

      // Get projects count
      const { count: projectsCount, error: projectsError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgData.id);

      if (projectsError) throw projectsError;

      // Calculate usage limits
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const currentUsage = orgData.organization_usage || [];
      
      const projectsUsed = projectsCount || 0;
      const aiRequestsUsed = currentUsage.find(u => u.metric_name === 'ai_requests' && u.period === currentPeriod)?.metric_value || 0;
      const membersUsed = allMembers?.length || 0;

      const limits = {
        projects: {
          used: projectsUsed,
          limit: orgData.max_projects,
          percentage: Math.round((projectsUsed / orgData.max_projects) * 100)
        },
        ai_requests: {
          used: aiRequestsUsed,
          limit: orgData.max_ai_requests,
          percentage: Math.round((aiRequestsUsed / orgData.max_ai_requests) * 100)
        },
        members: {
          used: membersUsed,
          limit: orgData.max_members,
          percentage: Math.round((membersUsed / orgData.max_members) * 100)
        }
      };

      const enrichedOrg: OrganizationWithMembers = {
        ...orgData,
        members: allMembers || [],
        member_count: membersUsed,
        current_usage: currentUsage,
        limits
      };

      setOrganization(enrichedOrg);
      
      // Set current user's role
      const userMember = orgData.organization_members.find((m: any) => m.user_id === user.id);
      setCurrentUserRole(userMember?.role || null);

    } catch (err: any) {
      console.error('Organization loading error:', err);
      setError(err.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  }

  function getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function canManageMembers(): boolean {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  }

  function canManageSettings(): boolean {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  }

  if (loading) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-6 max-w-md w-full">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-6 max-w-md w-full">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Organization Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The organization you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {organization.name}
                  </h1>
                  <Badge variant="outline" className="text-xs">
                    {organization.plan.toUpperCase()}
                  </Badge>
                  <Badge className={`${ROLE_COLORS[currentUserRole!]} flex items-center gap-1 text-xs`}>
                    {React.createElement(ROLE_ICONS[currentUserRole!], { className: 'w-3 h-3' })}
                    {currentUserRole}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {organization.member_count} member{organization.member_count !== 1 ? 's' : ''} • Created {new Date(organization.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => router.push('/projects/new')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Button>
              {canManageSettings() && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/organization/${organization.slug}/settings`)}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'projects', label: 'Projects', icon: FolderOpen },
                { id: 'members', label: 'Members', icon: Users },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
                >
                  {React.createElement(tab.icon, { className: 'w-4 h-4' })}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Usage Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projects</CardTitle>
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.limits.projects.used}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    of {organization.limits.projects.limit} available
                  </p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(organization.limits.projects.percentage)}`}
                      style={{ width: `${Math.min(organization.limits.projects.percentage, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.limits.ai_requests.used.toLocaleString()}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    of {organization.limits.ai_requests.limit.toLocaleString()} this month
                  </p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(organization.limits.ai_requests.percentage)}`}
                      style={{ width: `${Math.min(organization.limits.ai_requests.percentage, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Members</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.limits.members.used}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    of {organization.limits.members.limit} allowed
                  </p>
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(organization.limits.members.percentage)}`}
                      style={{ width: `${Math.min(organization.limits.members.percentage, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Activity Feed Coming Soon</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Track project updates, member activities, and AI usage patterns here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h2>
              {canManageMembers() && (
                <Button className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Invite Members
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {organization.members.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role];
                return (
                  <Card key={member.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.users?.username?.charAt(0).toUpperCase() || member.users?.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {member.users?.username || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {member.users?.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`${ROLE_COLORS[member.role]} flex items-center gap-1`}>
                          <RoleIcon className="w-3 h-3" />
                          {member.role}
                        </Badge>
                        {canManageMembers() && member.role !== 'owner' && (
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Placeholder tabs */}
        {activeTab === 'projects' && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Projects View</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Project management interface coming soon
            </p>
            <Button onClick={() => router.push('/projects/new')}>
              Create First Project
            </Button>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Detailed usage analytics and reporting coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}