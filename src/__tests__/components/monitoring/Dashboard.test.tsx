import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MonitoringDashboard } from '@/components/monitoring/Dashboard';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

// Mock Supabase client
jest.mock('@supabase/auth-helpers-react', () => ({
  useSupabaseClient: jest.fn(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MonitoringDashboard', () => {
  const mockHealthData = {
    status: 'healthy',
    timestamp: '2025-07-20T12:00:00Z',
    version: '1.0.0',
    environment: 'test',
    supabase: {
      status: 'connected',
      latency: 50,
    },
    memory: {
      total: 1024,
      free: 512,
      used: 512,
    },
  };

  const mockMetricsData = [
    {
      timestamp: '2025-07-20T11:59:00Z',
      memory_used: 500,
      latency: 45,
    },
    {
      timestamp: '2025-07-20T11:58:00Z',
      memory_used: 490,
      latency: 48,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase client implementation
    (useSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockMetricsData,
        error: null,
      }),
    });

    // Mock fetch implementation
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockHealthData,
    });
  });

  it('renders loading state initially', () => {
    render(<MonitoringDashboard />);
    expect(screen.queryByText('System Monitor')).toBeInTheDocument();
  });

  it('displays health status when data is loaded', async () => {
    render(<MonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('healthy')).toBeInTheDocument();
      expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument();
    });
  });

  it('shows error message when health check fails', async () => {
    const errorMessage = 'Failed to fetch health status';
    mockFetch.mockRejectedValueOnce(new Error(errorMessage));

    render(<MonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('displays memory usage correctly', async () => {
    render(<MonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Memory Usage')).toBeInTheDocument();
      expect(screen.getByText('Used')).toBeInTheDocument();
      expect(screen.getByText('512MB')).toBeInTheDocument();
    });
  });

  it('shows metric history', async () => {
    render(<MonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Metric History')).toBeInTheDocument();
      expect(screen.getByText('Memory: 500MB')).toBeInTheDocument();
      expect(screen.getByText('Latency: 45ms')).toBeInTheDocument();
    });
  });

  it('updates metrics periodically', async () => {
    jest.useFakeTimers();

    render(<MonitoringDashboard />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('handles Supabase metrics storage failure gracefully', async () => {
    const mockError = { message: 'Failed to store metrics' };
    (useSupabaseClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ error: mockError }),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: [],
        error: mockError,
      }),
    });

    render(<MonitoringDashboard />);

    await waitFor(() => {
      expect(screen.getByText(mockError.message)).toBeInTheDocument();
    });
  });

  it('displays correct status colors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockHealthData, status: 'unhealthy' }),
    });

    render(<MonitoringDashboard />);

    await waitFor(() => {
      const statusElement = screen.getByText('unhealthy');
      expect(statusElement).toHaveClass('bg-red-500');
    });
  });
});
