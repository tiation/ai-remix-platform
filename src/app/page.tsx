'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types/supabase';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [user, setUser] = useState<any>(null);

  const allTags = [...new Set(projects.flatMap(p => p.tags))].filter(Boolean);

  useEffect(() => {
    async function loadData() {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Load public projects
      try {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*, author:users(username, avatar_url)')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        setProjects(projectsData || []);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
      
      setLoading(false);
    }

    loadData();
  }, []);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !filter || 
      project.title.toLowerCase().includes(filter.toLowerCase()) ||
      project.description?.toLowerCase().includes(filter.toLowerCase()) ||
      project.author.username.toLowerCase().includes(filter.toLowerCase());

    const matchesTag = !selectedTag || project.tags.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const handleCreateNew = async () => {
    if (!user) {
      // Redirect to auth
      window.location.href = '/auth';
      return;
    }

    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          title: 'Untitled Project',
          description: 'A new project created with Claude AI',
          code: '<!DOCTYPE html>\n<html>\n<head>\n  <title>My New Project</title>\n  <style>\n    body { font-family: Arial, sans-serif; padding: 20px; }\n    h1 { color: #333; }\n  </style>\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <p>Start building something amazing...</p>\n</body>\n</html>',
          tags: ['html', 'css'],
          user_id: user.id,
          is_public: true,
        })
        .select()
        .single();

      if (error) throw error;

      window.location.href = `/remix/${newProject.id}`;
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-transparent bg-clip-text">
                AI Remix Platform
              </h1>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredProjects.length} projects
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link 
                    href="/dashboard"
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    My Projects
                  </Link>
                  <button
                    onClick={handleCreateNew}
                    className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Create New
                  </button>
                </>
              ) : (
                <Link 
                  href="/auth"
                  className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects, authors..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            
            {(filter || selectedTag) && (
              <button
                onClick={() => {
                  setFilter('');
                  setSelectedTag('');
                }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {filter || selectedTag ? 'Try adjusting your search or filters.' : 'Be the first to create a project!'}
            </p>
            {user && (
              <button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
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
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {project.likes_count}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span>by {project.author.username}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
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
                      View
                    </Link>
                    <Link
                      href={`/remix/${project.id}`}
                      className="flex-1 bg-green-500 text-white text-sm py-2 px-3 rounded hover:bg-green-600 transition-colors text-center"
                    >
                      Remix
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
