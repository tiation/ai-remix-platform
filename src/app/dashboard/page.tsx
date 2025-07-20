'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Project, User } from '@/types/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-projects');

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/auth');
        return;
      }

      // Get user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userProfile) {
        setUser(userProfile);
      }

      // Get user's projects
      const { data: userProjects } = await supabase
        .from('projects')
        .select('*, author:users(username, avatar_url)')
        .eq('user_id', authUser.id)
        .order('updated_at', { ascending: false });

      setProjects(userProjects || []);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  const handleCreateProject = () => {
    router.push('/create');
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

  const publicProjects = projects.filter(p => p.is_public);
  const privateProjects = projects.filter(p => !p.is_public);
  const forkedProjects = projects.filter(p => p.forked_from);

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
              <span className="text-gray-700 dark:text-gray-300">Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Gallery
              </Link>
              <Link
                href="/dashboard/settings"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back, {user.username || 'Developer'}!
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  {user.email} • {projects.length} project{projects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleCreateProject}
              className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Create New Project
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('my-projects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-projects'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Projects ({projects.length})
              </button>
              <button
                onClick={() => setActiveTab('public')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'public'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Public ({publicProjects.length})
              </button>
              <button
                onClick={() => setActiveTab('private')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'private'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Private ({privateProjects.length})
              </button>
              <button
                onClick={() => setActiveTab('remixed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'remixed'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Remixed ({forkedProjects.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(activeTab === 'my-projects' ? projects :
            activeTab === 'public' ? publicProjects :
            activeTab === 'private' ? privateProjects :
            forkedProjects
          ).map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Project preview */}
              <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                <iframe
                  srcDoc={project.code}
                  className="w-full h-full border-0 pointer-events-none scale-50 origin-top-left"
                  style={{ width: '200%', height: '200%' }}
                  sandbox=""
                  title={`Preview of ${project.title}`}
                />
              </div>

              {/* Project info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {project.title}
                  </h3>
                  <div className="flex items-center space-x-1 ml-2">
                    {!project.is_public && (
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {project.likes_count} ❤️
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                  {project.forked_from && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Remixed</span>
                    </>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Link
                    href={`/remix/${project.id}`}
                    className="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded hover:bg-blue-600 transition-colors text-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {(activeTab === 'my-projects' ? projects :
          activeTab === 'public' ? publicProjects :
          activeTab === 'private' ? privateProjects :
          forkedProjects
        ).length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No projects yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {activeTab === 'my-projects' ? 'Create your first project to get started!' :
               activeTab === 'public' ? 'No public projects yet. Make some projects public to share them!' :
               activeTab === 'private' ? 'No private projects yet.' :
               'No remixed projects yet. Remix some projects from the gallery!'
              }
            </p>
            <button
              onClick={handleCreateProject}
              className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Your First Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}