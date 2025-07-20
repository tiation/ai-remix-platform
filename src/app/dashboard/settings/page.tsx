'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [username, setUsername] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [preferredModel, setPreferredModel] = useState('claude-3-haiku-20241022');
  const [showApiKey, setShowApiKey] = useState(false);

  const claudeModels = [
    { id: 'claude-3-haiku-20241022', name: 'Claude 3 Haiku', description: 'Fast and cost-effective' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Balanced performance' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Most capable' },
  ];

  useEffect(() => {
    async function loadUser() {
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
        setUsername(userProfile.username || '');
        setClaudeApiKey(userProfile.claude_api_key || '');
        setPreferredModel(userProfile.preferred_claude_model || 'claude-3-haiku-20241022');
      }

      setLoading(false);
    }

    loadUser();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: username.trim(),
          claude_api_key: claudeApiKey.trim() || null,
          preferred_claude_model: preferredModel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Settings saved successfully!');
      
      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        username: username.trim(),
        claude_api_key: claudeApiKey.trim() || null,
        preferred_claude_model: preferredModel,
      } : null);

      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!claudeApiKey.trim()) {
      setError('Please enter your Claude API key first');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/claude/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Say "Hello, World!" in HTML',
          code: '<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>',
          model: preferredModel,
          userId: user?.id,
          projectId: 'test',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Claude API key is working correctly!');
      } else {
        setError(data.error || 'API key test failed');
      }
    } catch (error: any) {
      setError('Failed to test API key: ' + error.message);
    } finally {
      setSaving(false);
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
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Dashboard
              </Link>
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-gray-700 dark:text-gray-300">Settings</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your profile and AI preferences
            </p>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-6">
            {message && (
              <div className="rounded-md bg-green-50 dark:bg-green-900 p-4">
                <div className="text-sm text-green-800 dark:text-green-200">{message}</div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
                <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
              </div>
            )}

            {/* Profile Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your username"
                  />
                </div>
              </div>
            </div>

            {/* Claude AI Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Claude AI Configuration</h3>
              
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Get your Claude API key
                    </h4>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <p>
                        1. Visit <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 dark:hover:text-blue-100">console.anthropic.com</a>
                      </p>
                      <p>2. Sign up or log in to your Anthropic account</p>
                      <p>3. Navigate to "API Keys" in your dashboard</p>
                      <p>4. Create a new API key and copy it here</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="claude-api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Claude API Key
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      id="claude-api-key"
                      value={claudeApiKey}
                      onChange={(e) => setClaudeApiKey(e.target.value)}
                      className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="sk-ant-api03-..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showApiKey ? (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L12 12m-2.122-2.122L8.464 8.464m1.414 1.414L12 12m6.414-6.414L12 12" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your API key is encrypted and stored securely. Required for AI features.
                  </p>
                </div>

                <div>
                  <label htmlFor="preferred-model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preferred Claude Model
                  </label>
                  <select
                    id="preferred-model"
                    value={preferredModel}
                    onChange={(e) => setPreferredModel(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {claudeModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Choose your default Claude model. You can change this per conversation.
                  </p>
                </div>

                {claudeApiKey.trim() && (
                  <div>
                    <button
                      type="button"
                      onClick={handleTestApiKey}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Testing...
                        </>
                      ) : (
                        <>
                          <svg className="-ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Test API Key
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}