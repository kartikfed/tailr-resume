import { useState, useEffect, useCallback } from 'react';
import { Message, ChatContext, ToolCall, ToolResult, ToolResponse, ChatResponse } from '../types/chat';
import { apiService } from '../services/apiService';
import { contextService } from '../services/contextService';
import { sendChatMessage } from '../services/chatService';
import { handleToolUse } from '../services/toolHandlers';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<ChatResponse | undefined>;
  updateContext: (context: ChatContext) => void;
  loadConversation: () => Promise<void>;
}

/**
 * Custom hook for managing chat state and interactions
 * @param {string} conversationId - The ID of the current conversation
 * @param {Function} onUpdateMessages - Optional callback for when messages are updated
 * @returns {UseChatReturn} Chat state and functions
 */
export function useChat(conversationId: string, onUpdateMessages?: (callback: (prevMessages: Message[]) => Message[]) => void): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ChatContext | null>(null);

  // Load conversation history and context
  const loadConversation = useCallback(async () => {
    try {
      // Load messages
      const response = await apiService.getConversation(conversationId);
      if (response.data && response.data.messages) {
        const loadedMessages: Message[] = response.data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        setMessages(loadedMessages);
        setError(null);
      }

      // Initialize context
      const context = await contextService.getContext(conversationId);
      
      // If context is empty, initialize with default versions
      if (!context.resumeVersion.id || !context.jobDescriptionVersion.id || !context.analysisVersion.id) {
        await contextService.updateContent(conversationId, {
          type: 'resume',
          content: '',
          version: 1
        });
        await contextService.updateContent(conversationId, {
          type: 'jobDescription',
          content: '',
          version: 1
        });
        await contextService.updateContent(conversationId, {
          type: 'analysis',
          content: '',
          version: 1
        });
      }
      
      setContext(context as ChatContext);
    } catch (error) {
      setError('Failed to load conversation history');
      console.error('Error loading conversation:', error);
    }
  }, [conversationId]);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /**
   * Updates the chat context with new information
   * @param {ChatContext} newContext - The new context to set
   */
  const updateContext = useCallback((newContext: ChatContext) => {
    setContext(newContext);
  }, []);

  /**
   * Sends a message to the chat service and handles the response
   * @param {string} content - The message content to send
   * @returns {Promise<ChatResponse | undefined>} The chat response
   */
  const sendMessage = useCallback(async (content: string): Promise<ChatResponse | undefined> => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message to chat
      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);

      // Get current context
      const currentContext = await contextService.getContext(conversationId);
      const currentContent = await contextService.getCurrentContent(conversationId);

      console.log('📤 Sending chat message:', {
        conversationId,
        hasResume: !!currentContent.resume,
        resumeLength: currentContent.resume?.length,
        hasJobDescription: !!currentContent.jobDescription,
        hasAnalysis: !!currentContent.analysis
      });

      // Send message to backend
      const response = await sendChatMessage([...messages, userMessage], {
        ...currentContext,
        content: currentContent,
        conversationId
      } as ChatContext);

      // Add assistant's response message
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Notify parent component if callback provided
      if (onUpdateMessages) {
        onUpdateMessages(prevMessages => [...prevMessages, assistantMessage]);
      }

      // Handle tool response if present
      if (response.toolResponse) {
        console.log('🛠️ Tool response received:', {
          success: response.toolResponse.success,
          summary: response.toolResponse.summary,
          hasMatches: Array.isArray(response.toolResponse.matches),
          matchCount: response.toolResponse.matches?.length,
          hasNewHtml: !!response.toolResponse.newHtml,
          newHtmlLength: response.toolResponse.newHtml?.length
        });

        // Log detailed match information if it's a findContent result
        if (Array.isArray(response.toolResponse.matches)) {
          console.log('🔍 findContent matches:', response.toolResponse.matches.map((match: { elementId: string; elementClass: string; content: string; context: string; }) => ({
            elementId: match.elementId,
            elementClass: match.elementClass,
            contentPreview: match.content?.substring(0, 50) + '...',
            contextPreview: match.context?.substring(0, 50) + '...'
          })));
        }

        const toolMessage: Message = {
          role: 'system',
          content: `Tool response: ${response.toolResponse.summary || 'Changes applied'}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, toolMessage]);

        if (onUpdateMessages) {
          console.log('📤 Forwarding tool response to parent component');
          onUpdateMessages(prevMessages => {
            const updatedMessages = [...prevMessages, toolMessage];
            // Add the tool response to the last message
            const lastMessage = updatedMessages[updatedMessages.length - 1];
            if (lastMessage) {
              lastMessage.toolResponse = response.toolResponse;
            }
            return updatedMessages;
          });
        }
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error in chat:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages, conversationId, onUpdateMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    updateContext,
    loadConversation
  };
} 