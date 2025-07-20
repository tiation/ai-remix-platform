import React from 'react';

export const LoadingFallback: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 to-gray-800">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-4 h-4 bg-cyan-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-cyan-500 rounded-full animate-pulse delay-200"></div>
          <div className="w-4 h-4 bg-cyan-500 rounded-full animate-pulse delay-400"></div>
        </div>
        <h2 className="text-xl font-semibold text-white">Loading...</h2>
        <p className="text-gray-400 mt-2">Please wait while we prepare your experience</p>
      </div>
    </div>
  );
};

export const ComponentLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse delay-150"></div>
        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse delay-300"></div>
        <span className="text-gray-600 dark:text-gray-300 ml-2">{text}</span>
      </div>
    </div>
  );
};

export const SkeletonLoader: React.FC<{
  count?: number;
  type?: 'text' | 'card' | 'image';
}> = ({ count = 1, type = 'text' }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((index) => (
          <div
            key={index}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse"
          >
            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className="space-y-4">
        {items.map((index) => (
          <div
            key={index}
            className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((index) => (
        <div key={index} className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
        </div>
      ))}
    </div>
  );
};
