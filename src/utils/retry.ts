interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultConfig: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors or 5xx server errors
    if (!error.response) return true;
    const status = error.response?.status;
    return status >= 500 && status < 600;
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...defaultConfig, ...config };
  let lastError: any;
  let delay = finalConfig.initialDelay;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === finalConfig.maxAttempts || !finalConfig.shouldRetry(error)) {
        throw error;
      }

      // Calculate next delay with exponential backoff
      delay = Math.min(
        delay * finalConfig.backoffFactor,
        finalConfig.maxDelay
      );

      // Add some jitter to prevent thundering herd
      const jitter = delay * (0.5 + Math.random() * 0.5);

      await new Promise(resolve => setTimeout(resolve, jitter));
    }
  }

  throw lastError;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  options: {
    maxFailures?: number;
    resetTimeout?: number;
    onStateChange?: (state: 'open' | 'closed' | 'half-open') => void;
  } = {}
): Promise<T> {
  const {
    maxFailures = 5,
    resetTimeout = 60000,
    onStateChange = () => {},
  } = options;

  let failures = 0;
  let lastFailureTime: number | null = null;
  let circuitState: 'open' | 'closed' | 'half-open' = 'closed';

  const updateState = (newState: typeof circuitState) => {
    if (newState !== circuitState) {
      circuitState = newState;
      onStateChange(newState);
    }
  };

  return async function circuitBreakerWrapper(): Promise<T> {
    if (circuitState === 'open') {
      if (lastFailureTime && Date.now() - lastFailureTime >= resetTimeout) {
        updateState('half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      if (circuitState === 'half-open') {
        updateState('closed');
      }
      failures = 0;
      return result;
    } catch (error) {
      failures++;
      lastFailureTime = Date.now();

      if (failures >= maxFailures) {
        updateState('open');
      }

      throw error;
    }
  }();
}
