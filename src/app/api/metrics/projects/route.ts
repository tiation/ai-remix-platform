import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get current date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    // Get total projects count
    const { count: totalProjects, error: totalError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get projects created today
    const { count: createdToday, error: todayError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString());

    if (todayError) throw todayError;

    // Get public vs private projects
    const { count: publicProjects, error: publicError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true);

    if (publicError) throw publicError;

    const privateProjects = (totalProjects || 0) - (publicProjects || 0);

    // Get forked/remixed projects
    const { count: forkedProjects, error: forkedError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .not('forked_from', 'is', null);

    if (forkedError) throw forkedError;

    // Get most popular projects (by likes)
    const { data: popularProjects, error: popularError } = await supabase
      .from('projects')
      .select('id, title, likes_count, created_at')
      .eq('is_public', true)
      .order('likes_count', { ascending: false })
      .limit(10);

    if (popularError) throw popularError;

    // Get projects created this week for growth calculation
    const { count: createdThisWeek, error: weekError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfWeek.toISOString());

    if (weekError) throw weekError;

    // Get most used tags
    const { data: allProjects, error: tagsError } = await supabase
      .from('projects')
      .select('tags')
      .not('tags', 'is', null);

    let topTags: { [key: string]: number } = {};
    if (!tagsError && allProjects) {
      const tagCounts: { [key: string]: number } = {};
      allProjects.forEach(project => {
        if (project.tags && Array.isArray(project.tags)) {
          project.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      // Get top 10 tags
      topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [tag, count]) => {
          obj[tag] = count;
          return obj;
        }, {} as { [key: string]: number });
    }

    const projectMetrics = {
      total: totalProjects || 0,
      created_today: createdToday || 0,
      created_this_week: createdThisWeek || 0,
      public: publicProjects || 0,
      private: privateProjects,
      forked: forkedProjects || 0,
      growth_rate_weekly: totalProjects ? (((createdThisWeek || 0) / totalProjects) * 100).toFixed(1) : '0',
      popular_projects: popularProjects || [],
      top_tags: topTags,
      visibility_breakdown: {
        public_percentage: totalProjects ? ((publicProjects || 0) / totalProjects * 100).toFixed(1) : '0',
        private_percentage: totalProjects ? (privateProjects / totalProjects * 100).toFixed(1) : '0'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(projectMetrics);
  } catch (error: any) {
    console.error('Project metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to collect project metrics', details: error.message },
      { status: 500 }
    );
  }
}