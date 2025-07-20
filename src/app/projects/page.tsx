import { Metadata } from 'next';
import { getProjects } from '@/lib/supabase';
import ProjectGallery from '@/components/ProjectGallery/ProjectGallery';

export const metadata: Metadata = {
  title: 'Projects Gallery | Tiation Portfolio',
  description: 'Browse and remix projects from our community',
};

export default async function ProjectsPage() {
  const projects = await getProjects({ isPublic: true });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-transparent bg-clip-text mb-4">
            Project Gallery
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Browse, preview, and remix projects from our community
          </p>
        </header>

        <ProjectGallery initialProjects={projects} />
      </div>
    </main>
  );
}
