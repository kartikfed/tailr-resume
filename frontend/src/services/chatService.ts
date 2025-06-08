import { Message, ChatContext } from '../types/chat';
import { apiService } from './apiService';
import { contextService } from '../services/contextService';

/**
 * Sends a chat message to the backend and returns the response
 * @param {Message[]} messages - The conversation history
 * @param {ChatContext} context - Optional context object
 * @returns {Promise<any>} The response from the backend
 */
export async function sendChatMessage(messages: Message[], context?: ChatContext): Promise<any> {
  try {
    // Get the last message from the array
    const lastMessage = messages[messages.length - 1];
    
    // Ensure we have the latest context
    const conversationId = context?.conversationId;
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    // Get current context and content
    const currentContext = await contextService.getContext(conversationId);
    const currentContent = await contextService.getCurrentContent(conversationId);

    console.log('🔍 Current Context:', currentContext);
    console.log('🔍 Current Content:', currentContent);
    
    // Ensure content is properly serialized
    const serializedContent = {
      resume: currentContent.resume || '',
      jobDescription: currentContent.jobDescription || '',
      analysis: currentContent.analysis || ''
    };

    const response = await apiService.post('/chat', {
      conversationId,
      message: lastMessage.content,
      context: {
        resumeVersion: currentContext.resumeVersion,
        jobDescriptionVersion: currentContext.jobDescriptionVersion,
        analysisVersion: currentContext.analysisVersion,
        content: serializedContent
      }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to send chat message');
    }

    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to send chat message');
  }
} 