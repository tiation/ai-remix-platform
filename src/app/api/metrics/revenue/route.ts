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
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Get revenue from successful payments today
    const { data: todayRevenue, error: todayError } = await supabase
      .from('ngo_revenue_log')
      .select('amount_paid')
      .gte('payment_date', startOfToday.toISOString())
      .lt('payment_date', endOfToday.toISOString());

    if (todayError) throw todayError;

    const revenueToday = todayRevenue?.reduce((sum, record) => sum + record.amount_paid, 0) || 0;

    // Get revenue this month
    const { data: monthRevenue, error: monthError } = await supabase
      .from('ngo_revenue_log')
      .select('amount_paid')
      .gte('payment_date', startOfMonth.toISOString());

    if (monthError) throw monthError;

    const revenueThisMonth = monthRevenue?.reduce((sum, record) => sum + record.amount_paid, 0) || 0;

    // Get NGO allocation (30% of total revenue)
    const ngoAllocationToday = revenueToday * 0.3;
    const ngoAllocationMonth = revenueThisMonth * 0.3;

    // Get active subscriptions count
    const { count: activeSubscriptions, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    if (subscriptionError) throw subscriptionError;

    // Get subscription breakdown by plan
    const { data: subscriptionBreakdown, error: planError } = await supabase
      .from('user_subscriptions')
      .select('plan_id')
      .eq('status', 'active');

    let planBreakdown = { starter: 0, pro: 0, enterprise: 0 };
    if (!planError && subscriptionBreakdown) {
      subscriptionBreakdown.forEach(sub => {
        if (sub.plan_id?.includes('pro')) planBreakdown.pro++;
        else if (sub.plan_id?.includes('enterprise')) planBreakdown.enterprise++;
        else planBreakdown.starter++;
      });
    }

    // Get revenue trend (last 30 days)
    const revenueTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const { data: dayRevenue, error: dayError } = await supabase
        .from('ngo_revenue_log')
        .select('amount_paid')
        .gte('payment_date', dayStart.toISOString())
        .lt('payment_date', dayEnd.toISOString());

      const dailyTotal = dayRevenue?.reduce((sum, record) => sum + record.amount_paid, 0) || 0;

      if (!dayError) {
        revenueTrend.push({
          date: dayStart.toISOString().split('T')[0],
          revenue: dailyTotal / 100, // Convert from cents to dollars
          ngo_allocation: (dailyTotal * 0.3) / 100
        });
      }
    }

    // Get top revenue-generating organizations
    const { data: topOrgs, error: topOrgsError } = await supabase
      .from('ngo_revenue_allocation')
      .select(`
        total_amount,
        ngo_allocation,
        created_at,
        subscription_id
      `)
      .order('total_amount', { ascending: false })
      .limit(10);

    if (topOrgsError) throw topOrgsError;

    // Calculate projections
    const dailyAverage = revenueThisMonth / today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const projectedMonthlyRevenue = dailyAverage * daysInMonth;

    // Calculate churn and growth metrics
    const { count: newSubscriptionsThisMonth, error: newSubError } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    if (newSubError) throw newSubError;

    const { count: cancelledThisMonth, error: cancelError } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
      .gte('cancelled_at', startOfMonth.toISOString());

    if (cancelError) throw cancelError;

    const churnRate = activeSubscriptions ? ((cancelledThisMonth || 0) / activeSubscriptions * 100).toFixed(1) : '0';
    const growthRate = activeSubscriptions ? ((newSubscriptionsThisMonth || 0) / activeSubscriptions * 100).toFixed(1) : '0';

    const revenueMetrics = {
      today: revenueToday / 100, // Convert from cents to dollars
      this_month: revenueThisMonth / 100,
      ngo_allocation_today: ngoAllocationToday / 100,
      ngo_allocation_month: ngoAllocationMonth / 100,
      active_subscriptions: activeSubscriptions || 0,
      subscription_breakdown: planBreakdown,
      revenue_trend: revenueTrend,
      top_revenue_sources: topOrgs?.map(org => ({
        ...org,
        total_amount: org.total_amount / 100,
        ngo_allocation: org.ngo_allocation / 100
      })) || [],
      projections: {
        monthly_projected: projectedMonthlyRevenue / 100,
        quarterly_projected: (projectedMonthlyRevenue * 3) / 100,
        annual_projected: (projectedMonthlyRevenue * 12) / 100
      },
      metrics: {
        average_revenue_per_user: activeSubscriptions ? (revenueThisMonth / activeSubscriptions / 100).toFixed(2) : '0',
        churn_rate: churnRate,
        growth_rate: growthRate,
        ngo_percentage: '30.0'
      },
      ngo_impact: {
        total_contributed: ngoAllocationMonth / 100,
        monthly_goal: 500, // $500 NGO funding goal
        progress_percentage: Math.min((ngoAllocationMonth / 100 / 500) * 100, 100).toFixed(1),
        beneficiary: 'ChaseWhiteRabbit NGO'
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(revenueMetrics);
  } catch (error: any) {
    console.error('Revenue metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to collect revenue metrics', details: error.message },
      { status: 500 }
    );
  }
}