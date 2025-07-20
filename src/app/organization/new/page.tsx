'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ORGANIZATION_PLANS } from '@/types/organization';
import { ArrowLeft, Check, Zap, Users, FolderOpen } from 'lucide-react';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'starter' as keyof typeof ORGANIZATION_PLANS
  });

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    setFormData({
      ...formData,
      name,
      slug
    });
  };

  const validateSlug = (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    if (!validateSlug(formData.slug)) {
      setError('Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to create an organization');
      }

      // Check if slug is available
      const { data: existingOrg, error: checkError } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }

      if (existingOrg) {
        setError('This organization name is already taken. Please choose a different one.');
        return;
      }

      // Create organization using the database function
      const { data: result, error: createError } = await supabase
        .rpc('create_organization_with_owner', {
          org_name: formData.name.trim(),
          org_slug: formData.slug,
          owner_id: user.id,
          plan_type: formData.plan
        });

      if (createError) {
        throw createError;
      }

      // Redirect to organization dashboard
      router.push(`/organization/${formData.slug}`);
    } catch (err: any) {
      console.error('Organization creation error:', err);
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create Organization
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Set up your team workspace for AI-powered development
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Organization Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter organization name"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      This will be displayed as your organization's public name
                    </p>
                  </div>

                  {/* Organization Slug */}
                  <div>
                    <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization URL
                    </label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600">
                        ai-remix.tiation.net/org/
                      </span>
                      <input
                        type="text"
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="organization-name"
                        pattern="[a-z0-9-]+"
                        required
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      3-50 characters, lowercase letters, numbers, and hyphens only
                    </p>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      Choose Your Plan
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(ORGANIZATION_PLANS).map(([key, plan]) => (
                        <div
                          key={key}
                          className={`relative cursor-pointer rounded-lg border p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors ${
                            formData.plan === key
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                              : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                          }`}
                          onClick={() => setFormData({ ...formData, plan: key as keyof typeof ORGANIZATION_PLANS })}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 ${
                                formData.plan === key
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {formData.plan === key && (
                                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                  {plan.name}
                                  {key === 'starter' && <Badge variant="success" className="text-xs">Free</Badge>}
                                  {key === 'pro' && <Badge variant="outline" className="text-xs">Popular</Badge>}
                                  {key === 'enterprise' && <Badge className="text-xs">Enterprise</Badge>}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  ${(plan.price / 100).toFixed(2)}/month {key === 'starter' && '(Free forever)'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                <div className="flex items-center gap-1">
                                  <FolderOpen className="w-4 h-4" />
                                  {plan.max_projects}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Zap className="w-4 h-4" />
                                  {plan.max_ai_requests}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {plan.max_members}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex flex-wrap gap-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                              >
                                {feature}
                              </span>
                            ))}
                            {plan.features.length > 3 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{plan.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !formData.name.trim() || !validateSlug(formData.slug)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? 'Creating...' : 'Create Organization'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Plan Details Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  {ORGANIZATION_PLANS[formData.plan].name}
                </CardTitle>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(ORGANIZATION_PLANS[formData.plan].price / 100).toFixed(2)}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/month</span>
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Features included:</h4>
                    <ul className="space-y-2">
                      {ORGANIZATION_PLANS[formData.plan].features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {formData.plan !== 'starter' && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        💝 <strong>Supporting Good:</strong> 30% of your subscription helps fund ChaseWhiteRabbit NGO's mission to provide AI tools for social impact organizations.
                      </p>
                    </div>
                  )}

                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      You can upgrade or downgrade your plan at any time. {formData.plan === 'starter' ? 'Start free and upgrade when you need more resources.' : 'Billing starts immediately after creation.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}