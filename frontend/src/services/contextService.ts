import { ConversationContext, VersionedContent, ContextUpdate } from '../types/chat';

/**
 * Service for managing versioned conversation context
 */
class ContextService {
  private static instance: ContextService;
  private activeContexts: Map<string, ConversationContext>;
  private contentVersions: Map<string, VersionedContent>;

  private constructor() {
    this.activeContexts = new Map();
    this.contentVersions = new Map();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ContextService {
    if (!ContextService.instance) {
      ContextService.instance = new ContextService();
    }
    return ContextService.instance;
  }

  /**
   * Initialize or get conversation context
   */
  public async getContext(conversationId: string): Promise<ConversationContext> {
    if (!this.activeContexts.has(conversationId)) {
      // Initialize new context
      const newContext: ConversationContext = {
        conversationId,
        resumeVersion: { id: '', version: 0 },
        jobDescriptionVersion: { id: '', version: 0 },
        analysisVersion: { id: '', version: 0 },
        lastUpdated: new Date()
      };
      this.activeContexts.set(conversationId, newContext);
    }
    return this.activeContexts.get(conversationId)!;
  }

  /**
   * Update content version
   */
  public async updateContent(conversationId: string, update: ContextUpdate): Promise<void> {
    const context = await this.getContext(conversationId);
    const contentId = `${conversationId}-${update.type}`;
    
    // Create new version
    const newVersion: VersionedContent = {
      id: contentId,
      content: update.content,
      version: update.version,
      timestamp: new Date()
    };
    
    // Store version
    this.contentVersions.set(contentId, newVersion);
    
    // Update context reference
    switch (update.type) {
      case 'resume':
        context.resumeVersion = { id: contentId, version: update.version };
        break;
      case 'jobDescription':
        context.jobDescriptionVersion = { id: contentId, version: update.version };
        break;
      case 'analysis':
        context.analysisVersion = { id: contentId, version: update.version };
        break;
    }
    
    context.lastUpdated = new Date();
    this.activeContexts.set(conversationId, context);
  }

  /**
   * Get current content for a conversation
   */
  public async getCurrentContent(conversationId: string): Promise<{
    resume: string;
    jobDescription: string;
    analysis: string;
  }> {
    const context = await this.getContext(conversationId);
    
    const resume = this.contentVersions.get(context.resumeVersion.id)?.content || '';
    const jobDescription = this.contentVersions.get(context.jobDescriptionVersion.id)?.content || '';
    const analysis = this.contentVersions.get(context.analysisVersion.id)?.content || '';
    
    return { resume, jobDescription, analysis };
  }

  /**
   * Check if context is current
   */
  public async isContextCurrent(conversationId: string): Promise<boolean> {
    const context = await this.getContext(conversationId);
    
    // Check if all versions exist and are current
    const resumeExists = this.contentVersions.has(context.resumeVersion.id);
    const jobDescriptionExists = this.contentVersions.has(context.jobDescriptionVersion.id);
    const analysisExists = this.contentVersions.has(context.analysisVersion.id);
    
    return resumeExists && jobDescriptionExists && analysisExists;
  }

  /**
   * Clear context for a conversation
   */
  public async clearContext(conversationId: string): Promise<void> {
    this.activeContexts.delete(conversationId);
    // Note: We don't delete content versions as they might be needed for history
  }
}

export const contextService = ContextService.getInstance(); 