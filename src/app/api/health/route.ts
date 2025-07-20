import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ai-remix-platform',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: 'unknown',
        memory: 'unknown',
        uptime: process.uptime(),
      }
    };

    // Check database connectivity
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1);
      
      if (error) throw error;
      healthCheck.checks.database = 'healthy';
    } catch (error) {
      healthCheck.checks.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    healthCheck.checks.memory = `${memUsageMB}MB`;

    // Overall health status
    if (healthCheck.checks.database === 'unhealthy') {
      healthCheck.status = 'unhealthy';
      return NextResponse.json(healthCheck, { status: 503 });
    }

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'ai-remix-platform',
        error: 'Health check failed',
        uptime: process.uptime(),
      },
      { status: 503 }
    );
  }
}