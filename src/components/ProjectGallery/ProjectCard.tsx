'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Project } from '@/types/supabase';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleRemix = async () => {
    // This will be implemented with Supabase logic
    router.push(`/remix/${project.id}`);
  };

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview Image */}
      <div className="relative h-48 w-full">
        <Image
          src={project.thumbnail_url}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Preview Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <a
              href={project.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors"
            >
              Live Preview
            </a>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {project.title}
          </h3>
          <button
            onClick={handleRemix}
            className="text-sm px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:opacity-90 transition-opacity"
          >
            Remix
          </button>
        </div>

        {/* Author */}
        <div className="flex items-center mb-3">
          <Image
            src={project.author.avatar_url}
            alt={project.author.username}
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
            Built by {project.author.username}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Likes count */}
        <div className="mt-3 flex items-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span className="text-sm">{project.likes_count}</span>
        </div>
      </div>
    </div>
  );
}
