'use client';

import { useState } from 'react';
import type { Project, ProjectFilters } from '@/types/supabase';
import ProjectCard from './ProjectCard';

interface ProjectGalleryProps {
  initialProjects: Project[];
}

export default function ProjectGallery({ initialProjects }: ProjectGalleryProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [selectedTag, setSelectedTag] = useState<string>();

  // Get unique tags from all projects
  const allTags = Array.from(
    new Set(projects.flatMap((project) => project.tags))
  ).sort();

  const filterProjects = (tag?: string) => {
    setSelectedTag(tag);
    setFilters({ ...filters, tag });
  };

  return (
    <div className="w-full">
      {/* Tags filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => filterProjects(undefined)}
          className={`px-4 py-2 rounded-full transition-all ${
            !selectedTag
              ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => filterProjects(tag)}
            className={`px-4 py-2 rounded-full transition-all ${
              selectedTag === tag
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects
          .filter((project) =>
            filters.tag ? project.tags.includes(filters.tag) : true
          )
          .map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
      </div>
    </div>
  );
}
