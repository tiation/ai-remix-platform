import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { RateLimiter } from '@/lib/rateLimiter';

jest.mock('@/lib/rateLimiter');
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createMiddlewareClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
  })),
}));

describe('API Middleware', () => {
  let mockRequest: Partial<NextRequest>;
  
  beforeEach(() => {
    mockRequest = {
      nextUrl: { pathname: '/api/test' },
      ip: '127.0.0.1',
      headers: new Headers(),
    };
    (RateLimiter as jest.Mock).mockImplementation(() => ({
      isAllowed: jest.fn().mockResolvedValue(true),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('applies security headers to responses', async () => {
    const response = await middleware(mockRequest as NextRequest);
    
    expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('blocks requests when rate limit is exceeded', async () => {
    (RateLimiter as jest.Mock).mockImplementation(() => ({
      isAllowed: jest.fn().mockResolvedValue(false),
    }));

    const response = await middleware(mockRequest as NextRequest);
    
    expect(response.status).toBe(429);
  });

  it('allows non-API routes without authentication', async () => {
    mockRequest.nextUrl.pathname = '/about';
    
    const response = await middleware(mockRequest as NextRequest);
    
    expect(response.status).not.toBe(401);
  });

  it('blocks unauthenticated API requests', async () => {
    mockRequest.nextUrl.pathname = '/api/protected';
    
    const response = await middleware(mockRequest as NextRequest);
    
    expect(response.status).toBe(401);
  });
});
