'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { projectTemplates, ProjectTemplate } from '@/lib/templates';

export default function CreateProjectPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/auth');
        return;
      }

      setUser(authUser);
      setLoading(false);
    }

    checkUser();
  }, [router]);

  const handleCreateFromTemplate = async (template: ProjectTemplate) => {
    if (!user || creating) return;

    setCreating(true);

    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          title: template.title,
          description: template.description,
          code: template.code,
          tags: template.tags,
          user_id: user.id,
          is_public: false, // Start as private
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/remix/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-transparent bg-clip-text"
              >
                AI Remix Platform
              </Link>
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-gray-700 dark:text-gray-300">Create New Project</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose a Template
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Start your project with a professional template. You can customize and modify it with Claude AI assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Template preview */}
              <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                <iframe
                  srcDoc={template.code}
                  className="w-full h-full border-0 pointer-events-none scale-50 origin-top-left"
                  style={{ width: '200%', height: '200%' }}
                  sandbox=""
                  title={`Preview of ${template.title}`}
                />
              </div>

              {/* Template info */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {template.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {template.description}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleCreateFromTemplate(template)}
                  disabled={creating}
                  className="w-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {creating ? 'Creating...' : 'Use This Template'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Custom option */}
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start from Scratch
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Begin with a blank HTML page and build your project from the ground up with Claude AI.
            </p>
            <button
              onClick={() => handleCreateFromTemplate(projectTemplates[0])} // Use blank template
              disabled={creating}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {creating ? 'Creating...' : 'Start from Blank'}
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}