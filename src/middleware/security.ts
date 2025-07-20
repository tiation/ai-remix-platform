import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export class SecurityMiddleware {
  private readonly trustedOrigins: string[];
  private readonly maxRequestSize: number;

  constructor() {
    this.trustedOrigins = (process.env.TRUSTED_ORIGINS || '').split(',');
    this.maxRequestSize = parseInt(process.env.MAX_REQUEST_SIZE || '5242880', 10); // 5MB default
  }

  async handleRequest(req: NextRequest): Promise<NextResponse | null> {
    // Apply initial security checks
    const initialCheck = this.performInitialChecks(req);
    if (initialCheck) return initialCheck;

    // Generate request ID for tracing
    const requestId = crypto.randomUUID();
    const response = NextResponse.next();

    // Add security headers
    this.addSecurityHeaders(response, requestId);

    // Add request ID to response for tracking
    response.headers.set('X-Request-ID', requestId);

    return response;
  }

  private performInitialChecks(req: NextRequest): NextResponse | null {
    // Check request size
    const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
    if (contentLength > this.maxRequestSize) {
      return new NextResponse('Request entity too large', { status: 413 });
    }

    // CORS check for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const origin = req.headers.get('origin');
      if (origin && !this.trustedOrigins.includes(origin)) {
        return new NextResponse('Invalid origin', { status: 403 });
      }
    }

    // Block common attack patterns
    const url = req.nextUrl.pathname;
    if (this.containsSuspiciousPatterns(url)) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    return null;
  }

  private addSecurityHeaders(response: NextResponse, nonce: string): void {
    // Content Security Policy
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' ${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "block-all-mixed-content",
      "upgrade-insecure-requests"
    ];

    response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    response.headers.set('Permissions-Policy', 
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
    );
  }

  private containsSuspiciousPatterns(url: string): boolean {
    const suspiciousPatterns = [
      /\.\./,                 // Directory traversal
      /[;&|`]/,              // Command injection
      /(union|select|insert|update|delete|drop)\s/i,  // SQL injection
      /<script|javascript:/i, // XSS
      /\/etc\/|\/var\/|\/usr\//i, // System file access
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
  }
}
