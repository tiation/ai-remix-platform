'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Project, User } from '@/types/supabase';
import CodeEditor from '@/components/CodeEditor';
import ClaudeChat from '@/components/ClaudeChat';

export default function ProjectEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [isOwnProject, setIsOwnProject] = useState(false);
  const [isRemixing, setIsRemixing] = useState(false);
  const [hasClaudeKey, setHasClaudeKey] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [projectMetadata, setProjectMetadata] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    is_public: true,
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
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
        setHasClaudeKey(!!userProfile.claude_api_key);
      }

      // Load project
      const { data: projectData } = await supabase
        .from('projects')
        .select('*, author:users(username, avatar_url)')
        .eq('id', params.id)
        .single();

      if (projectData) {
        setProject(projectData);
        setCode(projectData.code || '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>');
        setIsOwnProject(projectData.user_id === authUser.id);
        setProjectMetadata({
          title: projectData.title,
          description: projectData.description || '',
          tags: projectData.tags || [],
          is_public: projectData.is_public,
        });
      }

      setLoading(false);
    }

    loadData();
  }, [params.id, router]);

  const handleCodeChange = (newCode: string | undefined) => {
    if (newCode !== undefined) {
      setCode(newCode);
    }
  };

  const handleRemix = async () => {
    if (!user || !project) return;
    
    setIsRemixing(true);
    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          title: `${project.title} (Remix)`,
          description: project.description,
          code: code,
          tags: project.tags,
          user_id: user.id,
          forked_from: project.id,
          is_public: true,
          likes_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/remix/${newProject.id}`);
    } catch (error) {
      console.error('Error remixing project:', error);
    } finally {
      setIsRemixing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !project || !isOwnProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...projectMetadata,
          code: code,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) throw error;

      alert('Project saved successfully!');
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!project || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-500">Project not found</h1>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {projectMetadata.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isOwnProject ? 'Your project' : `By ${project.author.username}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            
            {isOwnProject ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            ) : (
              <button
                onClick={handleRemix}
                disabled={isRemixing}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isRemixing ? 'Remixing...' : 'Remix'}
              </button>
            )}
          </div>
        </div>

        {/* Project metadata for own projects */}
        {isOwnProject && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                value={projectMetadata.title}
                onChange={(e) => setProjectMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                placeholder="Project title"
              />
            </div>
            <div>
              <input
                type="text"
                value={projectMetadata.tags.join(', ')}
                onChange={(e) => setProjectMetadata(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                className="w-full text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                placeholder="Tags (comma separated)"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                checked={projectMetadata.is_public}
                onChange={(e) => setProjectMetadata(prev => ({ ...prev, is_public: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="is_public" className="text-sm">Public</label>
            </div>
          </div>
        )}
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex">
        {/* Code editor */}
        <div className={`${showPreview ? 'w-1/3' : 'w-2/3'} border-r border-gray-200 dark:border-gray-700`}>
          <div className="h-full">
            <CodeEditor
              value={code}
              onChange={handleCodeChange}
              language="html"
              height="100%"
            />
          </div>
        </div>

        {/* Claude chat */}
        <div className={`${showPreview ? 'w-1/3' : 'w-1/3'} ${showPreview ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
          <ClaudeChat
            code={code}
            onCodeUpdate={setCode}
            userId={user.id}
            projectId={project.id}
            disabled={!hasClaudeKey}
          />
        </div>

        {/* Live preview */}
        {showPreview && (
          <div className="w-1/3">
            <div className="h-full border-l border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Preview</h3>
              </div>
              <div className="h-full">
                <iframe
                  srcDoc={code}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                  title="Live Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
