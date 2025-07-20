interface ErrorInfo {
  componentStack?: string;
  [key: string]: any;
}

class ErrorReporting {
  private static instance: ErrorReporting;
  private initialized: boolean = false;
  private environment: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
  }

  static getInstance(): ErrorReporting {
    if (!ErrorReporting.instance) {
      ErrorReporting.instance = new ErrorReporting();
    }
    return ErrorReporting.instance;
  }

  init() {
    if (this.initialized) return;

    // Global error handler
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleError(error || new Error(message as string));
    };

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });

    this.initialized = true;
  }

  private async handleError(error: Error, info: ErrorInfo = {}) {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        environment: this.environment,
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...info,
      };

      // Log to console in development
      if (this.environment === 'development') {
        console.error('Error caught:', errorData);
        return;
      }

      // In production, send to error tracking service
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (e) {
      // Fallback error logging
      console.error('Failed to report error:', e);
    }
  }
}

export const errorReporting = ErrorReporting.getInstance();

export function captureException(error: Error, info?: ErrorInfo) {
  errorReporting.init();
  return errorReporting['handleError'](error, info);
}
