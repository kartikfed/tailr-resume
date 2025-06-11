/**
 * In-memory cache for embeddings to avoid redundant computations
 */
import { EmbeddingCache } from './types';

export class EmbeddingCacheManager {
  private static instance: EmbeddingCacheManager;
  private cache: EmbeddingCache;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private constructor() {
    this.cache = {};
  }

  public static getInstance(): EmbeddingCacheManager {
    if (!EmbeddingCacheManager.instance) {
      EmbeddingCacheManager.instance = new EmbeddingCacheManager();
    }
    return EmbeddingCacheManager.instance;
  }

  /**
   * Get embedding from cache if it exists and is not expired
   */
  public get(text: string): number[] | null {
    const cached = this.cache[text];
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      delete this.cache[text];
      return null;
    }

    return cached.embedding;
  }

  /**
   * Store embedding in cache
   */
  public set(text: string, embedding: number[]): void {
    this.cache[text] = {
      embedding,
      timestamp: Date.now()
    };
  }

  /**
   * Clear expired entries from cache
   */
  public cleanup(): void {
    const now = Date.now();
    Object.entries(this.cache).forEach(([key, value]) => {
      if (now - value.timestamp > this.CACHE_TTL) {
        delete this.cache[key];
      }
    });
  }
} 