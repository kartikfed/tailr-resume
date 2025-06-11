/**
 * Service for generating and managing embeddings using sentence-transformers
 */
import { pipeline } from '@xenova/transformers';
import { 
  EmbeddingResult, 
  BatchEmbeddingResult, 
  JobRequirementEmbedding, 
  ResumeSectionEmbedding 
} from './types';
import { EmbeddingCacheManager } from './cache';

export class EmbeddingService {
  private static instance: EmbeddingService;
  private model: any;
  private cache: EmbeddingCacheManager;
  private readonly MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
  private readonly BATCH_SIZE = 32;
  private isInitialized = false;

  private constructor() {
    this.cache = EmbeddingCacheManager.getInstance();
  }

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Initialize the embedding model
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.model = await pipeline('feature-extraction', this.MODEL_NAME);
      this.isInitialized = true;
      console.log('✅ Embedding model initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize embedding model:', error);
      throw new Error('Failed to initialize embedding model');
    }
  }

  /**
   * Generate embedding for a single text
   */
  public async generateEmbedding(text: string, metadata?: Record<string, any>): Promise<EmbeddingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Check cache first
      const cached = this.cache.get(text);
      if (cached) {
        return {
          embedding: cached,
          text,
          metadata
        };
      }

      // Generate new embedding
      const output = await this.model(text, {
        pooling: 'mean',
        normalize: true
      });

      // Convert output data to number array
      const embedding = Array.from(output.data) as number[];
      
      // Cache the result
      this.cache.set(text, embedding);

      return {
        embedding,
        text,
        metadata
      };
    } catch (error) {
      console.error('❌ Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  public async generateBatchEmbeddings(texts: string[], metadata?: Record<string, any>[]): Promise<BatchEmbeddingResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const results: EmbeddingResult[] = [];
      const errors: string[] = [];

      // Process in batches
      for (let i = 0; i < texts.length; i += this.BATCH_SIZE) {
        const batch = texts.slice(i, i + this.BATCH_SIZE);
        const batchMetadata = metadata?.slice(i, i + this.BATCH_SIZE);

        const batchPromises = batch.map((text, index) => 
          this.generateEmbedding(text, batchMetadata?.[index])
            .catch(error => {
              errors.push(`Failed to generate embedding for text at index ${i + index}: ${error.message}`);
              return null;
            })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter((result): result is EmbeddingResult => result !== null));
      }

      return {
        embeddings: results,
        error: errors.length > 0 ? errors.join('; ') : undefined
      };
    } catch (error) {
      console.error('❌ Error in batch embedding generation:', error);
      throw new Error('Failed to generate batch embeddings');
    }
  }

  /**
   * Generate embeddings for job requirements
   */
  public async generateJobRequirementEmbeddings(requirements: {
    skills?: string[];
    qualifications?: string[];
    responsibilities?: string[];
    keywords?: { text: string; priority: 'critical' | 'important' | 'nice_to_have' }[];
  }): Promise<JobRequirementEmbedding[]> {
    const allRequirements: JobRequirementEmbedding[] = [];

    // Process skills
    if (requirements.skills?.length) {
      const skillEmbeddings = await this.generateBatchEmbeddings(requirements.skills);
      allRequirements.push(...skillEmbeddings.embeddings.map(result => ({
        ...result,
        type: 'skill' as const
      })));
    }

    // Process qualifications
    if (requirements.qualifications?.length) {
      const qualificationEmbeddings = await this.generateBatchEmbeddings(requirements.qualifications);
      allRequirements.push(...qualificationEmbeddings.embeddings.map(result => ({
        ...result,
        type: 'qualification' as const
      })));
    }

    // Process responsibilities
    if (requirements.responsibilities?.length) {
      const responsibilityEmbeddings = await this.generateBatchEmbeddings(requirements.responsibilities);
      allRequirements.push(...responsibilityEmbeddings.embeddings.map(result => ({
        ...result,
        type: 'responsibility' as const
      })));
    }

    // Process keywords with priorities
    if (requirements.keywords?.length) {
      const keywordEmbeddings = await this.generateBatchEmbeddings(
        requirements.keywords.map(k => k.text)
      );
      allRequirements.push(...keywordEmbeddings.embeddings.map((result, index) => ({
        ...result,
        type: 'keyword' as const,
        priority: requirements.keywords![index].priority
      })));
    }

    return allRequirements;
  }

  /**
   * Generate embeddings for resume sections
   */
  public async generateResumeSectionEmbeddings(sections: {
    summary?: string;
    experience?: Array<{
      text: string;
      company?: string;
      role?: string;
      duration?: string;
      technologies?: string[];
    }>;
    skills?: string[];
    education?: string[];
    projects?: string[];
  }): Promise<ResumeSectionEmbedding[]> {
    const allSections: ResumeSectionEmbedding[] = [];

    // Process summary
    if (sections.summary) {
      const summaryEmbedding = await this.generateEmbedding(sections.summary);
      allSections.push({
        ...summaryEmbedding,
        section: 'summary' as const
      });
    }

    // Process experience
    if (sections.experience?.length) {
      const experienceEmbeddings = await this.generateBatchEmbeddings(
        sections.experience.map(e => e.text),
        sections.experience.map(e => ({
          company: e.company,
          role: e.role,
          duration: e.duration,
          technologies: e.technologies
        }))
      );
      allSections.push(...experienceEmbeddings.embeddings.map((result, index) => ({
        ...result,
        section: 'experience' as const,
        metadata: {
          company: sections.experience![index].company,
          role: sections.experience![index].role,
          duration: sections.experience![index].duration,
          technologies: sections.experience![index].technologies
        }
      })));
    }

    // Process skills
    if (sections.skills?.length) {
      const skillEmbeddings = await this.generateBatchEmbeddings(sections.skills);
      allSections.push(...skillEmbeddings.embeddings.map(result => ({
        ...result,
        section: 'skills' as const
      })));
    }

    // Process education
    if (sections.education?.length) {
      const educationEmbeddings = await this.generateBatchEmbeddings(sections.education);
      allSections.push(...educationEmbeddings.embeddings.map(result => ({
        ...result,
        section: 'education' as const
      })));
    }

    // Process projects
    if (sections.projects?.length) {
      const projectEmbeddings = await this.generateBatchEmbeddings(sections.projects);
      allSections.push(...projectEmbeddings.embeddings.map(result => ({
        ...result,
        section: 'projects' as const
      })));
    }

    return allSections;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  public calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitude1 * magnitude2);
  }
} 