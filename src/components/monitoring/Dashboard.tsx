import React, { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  supabase: {
    status: 'connected' | 'disconnected';
    latency: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
  };
}

interface MetricHistory {
  timestamp: string;
  memory_used: number;
  latency: number;
}

export const MonitoringDashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealth(data);

        // Store metrics in Supabase
        if (response.ok) {
          await supabase.from('monitoring_metrics').insert({
            status: data.status,
            memory_used: data.memory.used,
            latency: data.supabase.latency,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health status');
      }
    };

    const fetchMetricHistory = async () => {
      const { data, error } = await supabase
        .from('monitoring_metrics')
        .select('timestamp, memory_used, latency')
        .order('timestamp', { ascending: false })
        .limit(24);

      if (error) {
        setError(error.message);
      } else {
        setMetrics(data || []);
      }
    };

    // Initial fetch
    fetchHealth();
    fetchMetricHistory();

    // Set up polling
    const interval = setInterval(() => {
      fetchHealth();
      fetchMetricHistory();
    }, 60000); // Poll every minute

    return () => clearInterval(interval);
  }, [supabase]);

  const statusColor = health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6">System Monitor</h2>

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Overview */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Status</h3>
              <span className={`px-3 py-1 rounded-full ${statusColor}`}>
                {health.status}
              </span>
            </div>
            <div className="space-y-2">
              <p>Version: {health.version}</p>
              <p>Environment: {health.environment}</p>
              <p>Last Updated: {new Date(health.timestamp).toLocaleString()}</p>
            </div>
          </div>

          {/* Supabase Status */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Supabase Connection</h3>
            <div className="space-y-2">
              <p>Status: {health.supabase.status}</p>
              <p>Latency: {health.supabase.latency}ms</p>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Used</span>
                <span>{health.memory.used}MB</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-cyan-500 h-2.5 rounded-full"
                  style={{
                    width: `${(health.memory.used / health.memory.total) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>Total: {health.memory.total}MB</span>
                <span>Free: {health.memory.free}MB</span>
              </div>
            </div>
          </div>

          {/* Metric History */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Metric History</h3>
            <div className="space-y-2">
              {metrics.slice(0, 5).map((metric, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <span>{new Date(metric.timestamp).toLocaleTimeString()}</span>
                  <span>Memory: {metric.memory_used}MB</span>
                  <span>Latency: {metric.latency}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
