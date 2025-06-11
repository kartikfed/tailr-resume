/**
 * Types for the embedding service
 */

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  metadata?: Record<string, any>;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  error?: string;
}

export interface EmbeddingCache {
  [key: string]: {
    embedding: number[];
    timestamp: number;
  };
}

export interface JobRequirementEmbedding {
  text: string;
  embedding: number[];
  type: 'skill' | 'qualification' | 'responsibility' | 'keyword';
  priority?: 'critical' | 'important' | 'nice_to_have';
}

export interface ResumeSectionEmbedding {
  text: string;
  embedding: number[];
  section: 'summary' | 'experience' | 'skills' | 'education' | 'projects';
  metadata?: {
    company?: string;
    role?: string;
    duration?: string;
    technologies?: string[];
  };
} 