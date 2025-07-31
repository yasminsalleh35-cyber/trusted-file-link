/**
 * Performance Optimization Utilities
 * 
 * Provides caching, memoization, debouncing, and other performance
 * optimizations for the application.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Cache implementation
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global caches
const fileCache = new LRUCache<string, any>(50);
const userCache = new LRUCache<string, any>(20);
const downloadUrlCache = new LRUCache<string, { url: string; expires: number }>(30);

/**
 * Debounce hook for search inputs and other frequent operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for scroll events and other high-frequency operations
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * Memoized file operations
 */
export const useMemoizedFileOperations = () => {
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getFileIcon = useCallback((mimeType: string): string => {
    const type = mimeType.split('/')[0];
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'text': return '📄';
      case 'application':
        if (mimeType.includes('pdf')) return '📕';
        if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
        if (mimeType.includes('word')) return '📘';
        if (mimeType.includes('excel')) return '📊';
        if (mimeType.includes('powerpoint')) return '📈';
        return '📄';
      default: return '📄';
    }
  }, []);

  const isPreviewable = useCallback((mimeType: string): boolean => {
    const previewableTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'text/plain', 'text/csv', 'application/json',
      'application/pdf'
    ];
    return previewableTypes.includes(mimeType);
  }, []);

  return { formatFileSize, getFileIcon, isPreviewable };
};

/**
 * Cached file operations
 */
export const useCachedFileOperations = () => {
  const getCachedFile = useCallback((fileId: string) => {
    return fileCache.get(fileId);
  }, []);

  const setCachedFile = useCallback((fileId: string, fileData: any) => {
    fileCache.set(fileId, fileData);
  }, []);

  const getCachedDownloadUrl = useCallback((filePath: string) => {
    const cached = downloadUrlCache.get(filePath);
    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }
    return null;
  }, []);

  const setCachedDownloadUrl = useCallback((filePath: string, url: string, expiresInMs = 3600000) => {
    downloadUrlCache.set(filePath, {
      url,
      expires: Date.now() + expiresInMs
    });
  }, []);

  const clearFileCache = useCallback(() => {
    fileCache.clear();
    downloadUrlCache.clear();
  }, []);

  return {
    getCachedFile,
    setCachedFile,
    getCachedDownloadUrl,
    setCachedDownloadUrl,
    clearFileCache
  };
};

/**
 * Virtual scrolling for large lists
 */
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return { visibleItems, handleScroll };
};

/**
 * Lazy loading hook for images and files
 */
export const useLazyLoading = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * Batch operations for better performance
 */
export class BatchProcessor<T> {
  private batch: T[] = [];
  private batchSize: number;
  private delay: number;
  private processor: (items: T[]) => Promise<void>;
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    processor: (items: T[]) => Promise<void>,
    batchSize = 10,
    delay = 1000
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): void {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const items = [...this.batch];
    this.batch = [];

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    try {
      await this.processor(items);
    } catch (error) {
      console.error('Batch processing failed:', error);
    }
  }

  async forceFlush(): Promise<void> {
    await this.flush();
  }
}

/**
 * Memory usage monitoring
 */
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Performance timing utilities
 */
export class PerformanceTimer {
  private timers = new Map<string, number>();

  start(label: string): void {
    this.timers.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measure<T>(label: string, fn: () => T): T {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

export const performanceTimer = new PerformanceTimer();

/**
 * Optimized search hook with debouncing and caching
 */
export const useOptimizedSearch = <T>(
  items: T[],
  searchFields: (keyof T)[],
  debounceMs = 300
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  const searchCache = useRef(new Map<string, T[]>());

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return items;
    }

    const cacheKey = `${debouncedSearchTerm}-${items.length}`;
    const cached = searchCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    const searchLower = debouncedSearchTerm.toLowerCase();
    const filtered = items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value && 
               typeof value === 'string' && 
               value.toLowerCase().includes(searchLower);
      })
    );

    searchCache.current.set(cacheKey, filtered);
    
    // Limit cache size
    if (searchCache.current.size > 50) {
      const firstKey = searchCache.current.keys().next().value;
      searchCache.current.delete(firstKey);
    }

    return filtered;
  }, [items, debouncedSearchTerm, searchFields]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
    isSearching: searchTerm !== debouncedSearchTerm
  };
};

/**
 * Optimized pagination hook
 */
export const useOptimizedPagination = <T>(
  items: T[],
  itemsPerPage = 20
) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = items.slice(startIndex, endIndex);

    return {
      currentItems,
      currentPage,
      totalPages,
      totalItems: items.length,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, items.length)
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, paginationData.totalPages)));
  }, [paginationData.totalPages]);

  const nextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationData.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginationData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationData.hasPreviousPage]);

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    ...paginationData,
    goToPage,
    nextPage,
    previousPage,
    setCurrentPage
  };
};