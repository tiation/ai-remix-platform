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
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get total organizations count
    const { count: totalOrgs, error: totalError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    if (totalError) throw totalError;

    // Get organizations created this week
    const { count: newThisWeek, error: weekError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfWeek.toISOString());

    if (weekError) throw weekError;

    // Get organizations with recent activity (mock for now)
    // In production, you'd track last_activity_at or similar
    const activeToday = Math.floor((totalOrgs || 0) * 0.7); // Mock: 70% active today

    // Get organizations by plan
    const { data: orgsByPlan, error: planError } = await supabase
      .from('organizations')
      .select('plan')
      .then(result => {
        if (result.error) throw result.error;
        
        const planCounts = result.data?.reduce((acc: any, org) => {
          acc[org.plan] = (acc[org.plan] || 0) + 1;
          return acc;
        }, {});
        
        return { data: planCounts, error: null };
      });

    if (planError) throw planError;

    // Get growth metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newLast30Days, error: growthError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (growthError) throw growthError;

    const organizationMetrics = {
      total: totalOrgs || 0,
      active_today: activeToday,
      new_this_week: newThisWeek || 0,
      new_last_30_days: newLast30Days || 0,
      growth_rate: totalOrgs ? ((newLast30Days || 0) / totalOrgs * 100).toFixed(1) : '0',
      plans: orgsByPlan || {
        starter: 0,
        pro: 0,
        enterprise: 0
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(organizationMetrics);
  } catch (error: any) {
    console.error('Organization metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to collect organization metrics', details: error.message },
      { status: 500 }
    );
  }
}