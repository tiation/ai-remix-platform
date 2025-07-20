'use client';

import { useState } from 'react';
import { ClaudeEditRequest, ClaudeEditResponse } from '@/types/supabase';

interface ClaudeChatProps {
  code: string;
  onCodeUpdate: (newCode: string) => void;
  userId: string;
  projectId: string;
  disabled?: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'claude';
  content: string;
  timestamp: Date;
}

export default function ClaudeChat({
  code,
  onCodeUpdate,
  userId,
  projectId,
  disabled = false,
}: ClaudeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-3-haiku-20241022');

  const models = [
    { id: 'claude-3-haiku-20241022', name: 'Claude 3 Haiku (Fast)' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Balanced)' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Powerful)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const request: ClaudeEditRequest & { userId: string; projectId: string } = {
        prompt: input.trim(),
        code,
        model: selectedModel,
        userId,
        projectId,
      };

      const response = await fetch('/api/claude/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: ClaudeEditResponse | { error: string } = await response.json();

      if (!response.ok || 'error' in data) {
        throw new Error('error' in data ? data.error : 'Failed to get Claude response');
      }

      const claudeMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'claude',
        content: data.explanation || 'Code updated successfully!',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, claudeMessage]);
      
      // Update the code
      onCodeUpdate(data.code);

    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'claude',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Claude AI Assistant
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            disabled={disabled}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={disabled}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p className="text-lg mb-2">🤖 Ask Claude to help with your code!</p>
            <p className="text-sm">
              Try: "Add a navigation bar", "Make it responsive", "Fix any bugs", etc.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.content.startsWith('Error:')
                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "Add your Claude API key to use AI features" : "Ask Claude to modify your code..."}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            disabled={isLoading || disabled}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || disabled}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}