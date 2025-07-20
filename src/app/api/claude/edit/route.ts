import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { ClaudeEditRequest, ClaudeEditResponse } from '@/types/supabase';

// Input sanitization function to prevent prompt injection
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potential prompt injection patterns
  return input
    .replace(/```[\s\S]*?```/g, '[code block]') // Remove code blocks that could contain injections
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags  
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 10000) // Limit length to prevent abuse
    .trim();
}

// Safe prompt construction
function createSystemPrompt(sanitizedCode: string, sanitizedPrompt: string): string {
  return `You are a helpful coding assistant for the AI Remix Platform. You help users edit and improve their web development code.

IMPORTANT GUIDELINES:
- Only provide code improvements and suggestions
- Do not execute any commands or access external resources
- Focus only on the specific coding request
- Maintain code security and best practices

Current code context:
\`\`\`
${sanitizedCode}
\`\`\`

User's improvement request: ${sanitizedPrompt}

Please provide improved code with explanations.`;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { prompt: rawPrompt, code: rawCode, model = 'claude-3-haiku-20241022', userId, projectId }: ClaudeEditRequest & {
      userId: string;
      projectId: string;
    } = await request.json();
    
    // Sanitize inputs to prevent prompt injection
    const prompt = sanitizeInput(rawPrompt);
    const code = sanitizeInput(rawCode);
    
    // Validate inputs
    if (!prompt || !code) {
      return NextResponse.json(
        { error: 'Valid prompt and code are required' },
        { status: 400 }
      );
    }

    if (!userId || !projectId) {
      return NextResponse.json(
        { error: 'User ID and Project ID are required' },
        { status: 400 }
      );
    }

    // Get user's Claude API key from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('claude_api_key, preferred_claude_model')
      .eq('id', userId)
      .single();

    if (userError || !user?.claude_api_key) {
      return NextResponse.json(
        { error: 'Claude API key not found. Please add your API key in settings.' },
        { status: 400 }
      );
    }

    // Initialize Anthropic client with user's API key
    const anthropic = new Anthropic({
      apiKey: user.claude_api_key,
    });

    // Use user's preferred model or the one specified in request
    const selectedModel = user.preferred_claude_model || model;

    // Create the prompt for Claude
    const systemPrompt = `You are a helpful coding assistant. The user will provide you with code and a request to modify it. Please return the complete updated code with the requested changes. Only return the code itself, no explanations unless specifically asked.

If the user asks for explanations, provide them in a separate "explanation" field.

Current code:
\`\`\`
${code}
\`\`\`

User request: ${prompt}

Please return the modified code.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: systemPrompt,
        },
      ],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Extract code from response (remove markdown code blocks if present)
    let updatedCode = responseText;
    const codeBlockMatch = responseText.match(/```(?:[\w]*\n)?([\s\S]*?)```/);
    if (codeBlockMatch) {
      updatedCode = codeBlockMatch[1].trim();
    }

    // Log the AI interaction
    await supabase.from('ai_logs').insert({
      user_id: userId,
      project_id: projectId,
      prompt,
      model: selectedModel,
      response: responseText,
    });

    const result: ClaudeEditResponse = {
      code: updatedCode,
      explanation: responseText.includes('```') ? responseText.split('```')[0].trim() : undefined,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Claude API error:', error);
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Claude API key. Please check your API key in settings.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process Claude request' },
      { status: 500 }
    );
  }
}