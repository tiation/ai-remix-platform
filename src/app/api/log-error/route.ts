import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Error logging endpoint for client-side errors
export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      stack, 
      url, 
      userAgent, 
      userId, 
      timestamp 
    } = await request.json();

    // Basic input validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Valid error message is required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedError = {
      message: message.slice(0, 1000), // Limit message length
      stack: stack ? stack.slice(0, 2000) : null, // Limit stack trace
      url: url ? url.slice(0, 500) : null,
      userAgent: userAgent ? userAgent.slice(0, 500) : null,
      userId: userId || null,
      timestamp: timestamp || new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
    };

    // Log to database (create error_logs table if needed)
    const { error } = await supabase
      .from('error_logs')
      .insert(sanitizedError);

    if (error) {
      console.error('Failed to log error to database:', error);
      // Still return success to avoid infinite error loops
    }

    // Also log to console for immediate visibility
    console.error('Client Error:', {
      message: sanitizedError.message,
      url: sanitizedError.url,
      userId: sanitizedError.userId,
      timestamp: sanitizedError.timestamp,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Error logged successfully' 
    });

  } catch (error) {
    console.error('Error logging endpoint failed:', error);
    
    // Return success to prevent client-side error loops
    return NextResponse.json({ 
      success: true,
      message: 'Error received' 
    });
  }
}

// Health check for the error logging service
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    service: 'error-logging',
    timestamp: new Date().toISOString()
  });
}