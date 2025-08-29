// Simple in-memory cache for map data
interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MapsCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  // Generate cache key from request parameters
  private generateKey(params: unknown): string {
    return JSON.stringify(params);
  }

  // Check if cache entry is still valid
  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Get data from cache
  get(params: unknown): unknown | null {
    const key = this.generateKey(params);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      return entry.data;
    }
    
    // Remove expired entry
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  // Set data in cache
  set(params: unknown, data: unknown, ttl: number = this.defaultTTL): void {
    const key = this.generateKey(params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const mapsCache = new MapsCache();

// Debounce utility for API calls
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for frequent updates
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
