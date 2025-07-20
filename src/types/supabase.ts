export type User = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  claude_api_key?: string;
  preferred_claude_model?: string;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  code: string;
  preview_url?: string;
  repo_url?: string;
  thumbnail_url?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  forked_from?: string;
  is_public: boolean;
  likes_count: number;
  author: {
    username: string;
    avatar_url: string;
  };
};

export type AILog = {
  id: string;
  user_id: string;
  project_id: string;
  prompt: string;
  model: string;
  response: string;
  created_at: string;
};

export type ProjectMetadata = {
  title: string;
  description: string;
  tags: string[];
  code?: string;
  preview_url?: string;
  repo_url?: string;
  thumbnail_url?: string;
  is_public: boolean;
};

export type ClaudeEditRequest = {
  prompt: string;
  code: string;
  model?: string;
};

export type ClaudeEditResponse = {
  code: string;
  explanation?: string;
};

export type RemixProjectInput = {
  sourceProjectId: string;
  metadata: Partial<ProjectMetadata>;
};

export type ProjectFilters = {
  tag?: string;
  userId?: string;
  isPublic?: boolean;
};
