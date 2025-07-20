import { createClient } from '@supabase/supabase-js';
import { captureException } from './errorReporting';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getProjects(filters?: {
  tag?: string;
  userId?: string;
  isPublic?: boolean;
}): Promise<any[]> {
  try {
    let query = supabase
      .from('projects')
      .select(`
        *,
        author:users(username, avatar_url)
      `);

    if (filters?.tag) {
      query = query.contains('tags', [filters.tag]);
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      captureException(error);
      return [];
    }

    return data || [];
  } catch (error) {
    captureException(error as Error);
    return [];
  }
}

export async function remixProject(sourceId: string, userId: string, metadata: Record<string, any>) {
  try {
    const { data: sourceProject, error: sourceError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !sourceProject) {
      throw new Error('Source project not found');
    }

    const { data: newProject, error } = await supabase
      .from('projects')
      .insert({
        ...sourceProject,
        id: undefined, // Let Supabase generate a new ID
        user_id: userId,
        forked_from: sourceId,
        likes_count: 0,
        ...metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return newProject;
  } catch (error) {
    captureException(error as Error);
    throw new Error('Failed to remix project');
  }
}

export async function likeProject(projectId: string, userId: string) {
  try {
    const { data: existingLike, error: existingError } = await supabase
      .from('project_likes')
      .select()
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existingError) {
      throw existingError;
    }

    if (existingLike) {
      // Unlike
      await supabase
        .from('project_likes')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      await supabase.rpc('decrement_likes', { project_id: projectId });
    } else {
      // Like
      await supabase.from('project_likes').insert({
        project_id: projectId,
        user_id: userId,
      });

      await supabase.rpc('increment_likes', { project_id: projectId });
    }
  } catch (error) {
    captureException(error as Error);
    throw new Error('Failed to like project');
  }
}
