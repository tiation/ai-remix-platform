'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Activity, 
  Server, 
  Database, 
  Zap, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download
} from 'lucide-react';

interface SystemMetrics {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: {
    nextjs: {
      status: 'healthy' | 'degraded' | 'down';
      response_time: number;
      memory_usage: number;
      cpu_usage: number;
      requests_per_minute: number;
    };
    database: {
      status: 'healthy' | 'degraded' | 'down';
      connections_active: number;
      connections_max: number;
      query_time_avg: number;
      queries_per_second: number;
    };
    redis: {
      status: 'healthy' | 'degraded' | 'down';
      memory_usage: number;
      hit_rate: number;
      operations_per_second: number;
    };
    supabase: {
      status: 'healthy' | 'degraded' | 'down';
      auth_requests: number;
      api_requests: number;
      storage_usage: number;
    };
  };
  organizations: {
    total: number;
    active_today: number;
    new_this_week: number;
  };
  projects: {
    total: number;
    created_today: number;
    public: number;
    private: number;
  };
  ai_usage: {
    requests_today: number;
    requests_this_month: number;
    average_response_time: number;
    most_used_model: string;
  };
  revenue: {
    today: number;
    this_month: number;
    ngo_allocation: number;
    active_subscriptions: number;
  };
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  async function loadMetrics() {
    try {
      setError(null);
      
      // Fetch system health
      const healthResponse = await fetch('/api/health');
      const healthData = await healthResponse.json();

      // Fetch metrics from various endpoints
      const [
        metricsResponse,
        organizationsResponse,
        projectsResponse,
        aiUsageResponse,
        revenueResponse
      ] = await Promise.all([
        fetch('/api/metrics/system'),
        fetch('/api/metrics/organizations'),
        fetch('/api/metrics/projects'),
        fetch('/api/metrics/ai-usage'),
        fetch('/api/metrics/revenue')
      ]);

      // Mock data for demo (replace with real API calls)
      const mockMetrics: SystemMetrics = {
        status: healthData.status === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          nextjs: {
            status: 'healthy',
            response_time: 142,
            memory_usage: 68,
            cpu_usage: 23,
            requests_per_minute: 847
          },
          database: {
            status: 'healthy',
            connections_active: 23,
            connections_max: 100,
            query_time_avg: 8.5,
            queries_per_second: 156
          },
          redis: {
            status: 'healthy',
            memory_usage: 34,
            hit_rate: 96.8,
            operations_per_second: 423
          },
          supabase: {
            status: 'healthy',
            auth_requests: 1247,
            api_requests: 3891,
            storage_usage: 12.7
          }
        },
        organizations: {
          total: 127,
          active_today: 89,
          new_this_week: 23
        },
        projects: {
          total: 1456,
          created_today: 34,
          public: 892,
          private: 564
        },
        ai_usage: {
          requests_today: 2847,
          requests_this_month: 47293,
          average_response_time: 1.8,
          most_used_model: 'claude-3-haiku-20241022'
        },
        revenue: {
          today: 127.50,
          this_month: 3847.25,
          ngo_allocation: 1154.18,
          active_subscriptions: 89
        }
      };

      setMetrics(mockMetrics);
    } catch (err: any) {
      console.error('Failed to load metrics:', err);
      setError(err.message || 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'down': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-6 max-w-md w-full">
          <h1 className="text-xl font-semibold text-red-600 mb-2">Monitoring Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={loadMetrics} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  System Monitoring
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  AI Remix Platform - Enterprise Dashboard
                </p>
              </div>
              <Badge className={`${getStatusColor(metrics?.status || 'unknown')} text-white flex items-center gap-1`}>
                {getStatusIcon(metrics?.status || 'unknown')}
                {metrics?.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={loadMetrics} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Services Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next.js App</CardTitle>
              <Server className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getStatusColor(metrics?.services.nextjs.status || 'unknown')} text-white text-xs`}>
                  {metrics?.services.nextjs.status?.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  {metrics?.services.nextjs.response_time}ms avg
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div>CPU: {metrics?.services.nextjs.cpu_usage}%</div>
                <div>RAM: {metrics?.services.nextjs.memory_usage}%</div>
                <div colSpan={2}>
                  {metrics?.services.nextjs.requests_per_minute} req/min
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getStatusColor(metrics?.services.database.status || 'unknown')} text-white text-xs`}>
                  {metrics?.services.database.status?.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  {metrics?.services.database.query_time_avg}ms avg
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div>Connections: {metrics?.services.database.connections_active}/{metrics?.services.database.connections_max}</div>
                <div>QPS: {metrics?.services.database.queries_per_second}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redis Cache</CardTitle>
              <Zap className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getStatusColor(metrics?.services.redis.status || 'unknown')} text-white text-xs`}>
                  {metrics?.services.redis.status?.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  {metrics?.services.redis.hit_rate}% hit rate
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div>Memory: {metrics?.services.redis.memory_usage}%</div>
                <div>OPS: {metrics?.services.redis.operations_per_second}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supabase</CardTitle>
              <Server className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getStatusColor(metrics?.services.supabase.status || 'unknown')} text-white text-xs`}>
                  {metrics?.services.supabase.status?.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-600">
                  {metrics?.services.supabase.storage_usage}GB storage
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div>Auth: {metrics?.services.supabase.auth_requests}</div>
                <div>API: {metrics?.services.supabase.api_requests}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.organizations.total}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{metrics?.organizations.new_this_week} this week
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {metrics?.organizations.active_today} active today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.projects.total}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +{metrics?.projects.created_today} today
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {metrics?.projects.public} public, {metrics?.projects.private} private
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
              <Zap className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.ai_usage.requests_today.toLocaleString()}</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <Clock className="w-3 h-3 mr-1" />
                {metrics?.ai_usage.average_response_time}s avg response
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {metrics?.ai_usage.requests_this_month.toLocaleString()} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.revenue.today.toFixed(2)}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                ${metrics?.revenue.this_month.toLocaleString()} this month
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                ${metrics?.revenue.ngo_allocation.toFixed(2)} for ChaseWhiteRabbit NGO
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Response Time</span>
                    <span>{metrics?.services.nextjs.response_time}ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((metrics?.services.nextjs.response_time || 0) / 500 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Database Query Time</span>
                    <span>{metrics?.services.database.query_time_avg}ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((metrics?.services.database.query_time_avg || 0) / 50 * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cache Hit Rate</span>
                    <span>{metrics?.services.redis.hit_rate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${metrics?.services.redis.hit_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{metrics?.services.nextjs.cpu_usage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${(metrics?.services.nextjs.cpu_usage || 0) > 80 ? 'bg-red-500' : (metrics?.services.nextjs.cpu_usage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${metrics?.services.nextjs.cpu_usage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{metrics?.services.nextjs.memory_usage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${(metrics?.services.nextjs.memory_usage || 0) > 80 ? 'bg-red-500' : (metrics?.services.nextjs.memory_usage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${metrics?.services.nextjs.memory_usage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Database Connections</span>
                    <span>{metrics?.services.database.connections_active}/{metrics?.services.database.connections_max}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${((metrics?.services.database.connections_active || 0) / (metrics?.services.database.connections_max || 100)) > 0.8 ? 'bg-red-500' : ((metrics?.services.database.connections_active || 0) / (metrics?.services.database.connections_max || 100)) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${((metrics?.services.database.connections_active || 0) / (metrics?.services.database.connections_max || 100)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last updated */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Last updated: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString() : 'Never'}
        </div>
      </div>
    </div>
  );
}