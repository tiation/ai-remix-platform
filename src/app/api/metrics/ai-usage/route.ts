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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM format

    // Get AI usage stats from ai_logs table
    const { count: requestsToday, error: todayError } = await supabase
      .from('ai_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfToday.toISOString());

    if (todayError) throw todayError;

    // Get AI usage this month from organization_usage table
    const { data: monthlyUsage, error: monthlyError } = await supabase
      .from('organization_usage')
      .select('metric_value')
      .eq('metric_name', 'ai_requests')
      .eq('period', currentMonth);

    if (monthlyError) throw monthlyError;

    const requestsThisMonth = monthlyUsage?.reduce((sum, record) => sum + record.metric_value, 0) || 0;

    // Get most used models from ai_logs
    const { data: modelUsage, error: modelError } = await supabase
      .from('ai_logs')
      .select('model')
      .gte('created_at', startOfMonth.toISOString());

    let modelStats: { [key: string]: number } = {};
    let mostUsedModel = 'claude-3-haiku-20241022';
    
    if (!modelError && modelUsage) {
      const modelCounts: { [key: string]: number } = {};
      modelUsage.forEach(log => {
        if (log.model) {
          modelCounts[log.model] = (modelCounts[log.model] || 0) + 1;
        }
      });
      
      modelStats = modelCounts;
      mostUsedModel = Object.entries(modelCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'claude-3-haiku-20241022';
    }

    // Get average response time (mock for now, would need to track in production)
    const averageResponseTime = 1.2 + (Math.random() * 1.6); // Mock: 1.2-2.8 seconds

    // Get usage by organization
    const { data: orgUsage, error: orgError } = await supabase
      .from('organization_usage')
      .select(`
        organization_id,
        metric_value,
        organizations (
          name,
          plan
        )
      `)
      .eq('metric_name', 'ai_requests')
      .eq('period', currentMonth)
      .order('metric_value', { ascending: false })
      .limit(10);

    if (orgError) throw orgError;

    // Get usage trends (last 7 days)
    const usageTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const { count: dayRequests, error: dayError } = await supabase
        .from('ai_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      if (!dayError) {
        usageTrend.push({
          date: dayStart.toISOString().split('T')[0],
          requests: dayRequests || 0
        });
      }
    }

    // Calculate costs (mock pricing)
    const modelCosts = {
      'claude-3-haiku-20241022': 0.0004, // $0.0004 per request
      'claude-3-sonnet-20241022': 0.003,
      'claude-3-opus-20241022': 0.015
    };

    let estimatedCost = 0;
    Object.entries(modelStats).forEach(([model, count]) => {
      const costPerRequest = modelCosts[model as keyof typeof modelCosts] || 0.001;
      estimatedCost += count * costPerRequest;
    });

    const aiUsageMetrics = {
      requests_today: requestsToday || 0,
      requests_this_month: requestsThisMonth,
      average_response_time: parseFloat(averageResponseTime.toFixed(2)),
      most_used_model: mostUsedModel,
      model_breakdown: modelStats,
      top_organizations: orgUsage || [],
      usage_trend: usageTrend,
      estimated_monthly_cost: parseFloat(estimatedCost.toFixed(2)),
      efficiency_metrics: {
        requests_per_user: requestsThisMonth > 0 ? parseFloat((requestsThisMonth / Math.max(1, Object.keys(modelStats).length)).toFixed(1)) : 0,
        success_rate: 98.5, // Mock success rate
        retry_rate: 1.2 // Mock retry rate
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(aiUsageMetrics);
  } catch (error: any) {
    console.error('AI usage metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to collect AI usage metrics', details: error.message },
      { status: 500 }
    );
  }
}