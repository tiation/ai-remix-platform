interface CacheConfig {
  maxAge?: number;
  maxItems?: number;
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private cache: Map<string, CacheItem<T>>;
  private maxAge: number;
  private maxItems: number;

  constructor(config: CacheConfig = {}) {
    this.cache = new Map();
    this.maxAge = config.maxAge || 5 * 60 * 1000; // 5 minutes default
    this.maxItems = config.maxItems || 1000;
  }

  set(key: string, value: T): void {
    this.cleanup();

    if (this.cache.size >= this.maxItems) {
      // Remove oldest item
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.maxAge,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export class PersistentCache<T> extends Cache<T> {
  private storageKey: string;

  constructor(storageKey: string, config: CacheConfig = {}) {
    super(config);
    this.storageKey = storageKey;
    this.loadFromStorage();
  }

  set(key: string, value: T): void {
    super.set(key, value);
    this.saveToStorage();
  }

  delete(key: string): void {
    super.delete(key);
    this.saveToStorage();
  }

  clear(): void {
    super.clear();
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([key, item]) => {
          super.set(key, (item as CacheItem<T>).value);
        });
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, CacheItem<T>> = {};
      this.cache.forEach((item, key) => {
        data[key] = item;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }
}

// Usage example:
export function createProjectCache() {
  return new PersistentCache<any>('project-cache', {
    maxAge: 30 * 60 * 1000, // 30 minutes
    maxItems: 100,
  });
}

export function createUserCache() {
  return new PersistentCache<any>('user-cache', {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxItems: 50,
  });
}
