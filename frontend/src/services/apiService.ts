import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ApiResponse, Conversation, UploadResponse } from '../types';
import { VersionedMessage, ContextUpdate } from '../types/chat';
import { contextService } from './contextService';

// Type for uploadFiles payload
export interface UploadFilePayload {
  name: string;
  type: string;
  size: number;
  content: string;
  isPdf: boolean;
  useClaude: boolean;
}

/**
 * API service for making HTTP requests
 */
export const apiService = {
  /**
   * Sends a POST request to the specified endpoint
   * @param {string} endpoint - The API endpoint
   * @param {any} data - The data to send
   * @returns {Promise<ApiResponse<any>>} The response data
   */
  async post(endpoint: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
      return { data: response.data, error: null };
    } catch (error) {
      console.error('API request failed:', error);
      if (axios.isAxiosError(error)) {
        return { 
          data: null, 
          error: new Error(error.response?.data?.message || error.message || 'API request failed')
        };
      }
      return { data: null, error: error as Error };
    }
  },

  /**
   * Sends a GET request to the specified endpoint
   * @param {string} endpoint - The API endpoint
   * @returns {Promise<ApiResponse<any>>} The response data
   */
  async get(endpoint: string): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      return { data: response.data, error: null };
    } catch (error) {
      console.error('API request failed:', error);
      if (axios.isAxiosError(error)) {
        return { 
          data: null, 
          error: new Error(error.response?.data?.message || error.message || 'API request failed')
        };
      }
      return { data: null, error: error as Error };
    }
  },

  async sendMessage(
    conversationId: string,
    message: string,
    files: File[] = []
  ): Promise<ApiResponse<{ response: string }>> {
    try {
      // Get current context
      const context = await contextService.getContext(conversationId);
      const currentContent = await contextService.getCurrentContent(conversationId);

      const response = await axios.post(`${API_BASE_URL}/api/spec/chat`, {
        conversationId,
        message,
        context: {
          resumeVersion: context.resumeVersion,
          jobDescriptionVersion: context.jobDescriptionVersion,
          analysisVersion: context.analysisVersion,
          content: currentContent
        }
      });
      return { data: response.data, error: null };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return { 
          data: null, 
          error: new Error(error.response?.data?.message || error.message || 'Failed to send message')
        };
      }
      return { data: null, error: error as Error };
    }
  },

  async updateContext(
    conversationId: string,
    update: ContextUpdate
  ): Promise<ApiResponse<void>> {
    try {
      await contextService.updateContent(conversationId, update);
      return { data: undefined, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async getContext(conversationId: string): Promise<ApiResponse<{
    resume: string;
    jobDescription: string;
    analysis: string;
  }>> {
    try {
      const content = await contextService.getCurrentContent(conversationId);
      return { data: content, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async uploadFiles(
    conversationId: string,
    files: UploadFilePayload[]
  ): Promise<ApiResponse<UploadResponse>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/spec/upload`, {
        conversationId,
        files
      });
      return { data: response.data, error: null };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return { 
          data: null, 
          error: new Error(error.response?.data?.message || error.message || 'Failed to upload files')
        };
      }
      return { data: null, error: error as Error };
    }
  },

  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/spec/conversation/${conversationId}`);
      return { data: response.data, error: null };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return { 
          data: null, 
          error: new Error(error.response?.data?.message || error.message || 'Failed to get conversation')
        };
      }
      return { data: null, error: error as Error };
    }
  },

  async analyzeSimilarity(
    jobRequirements: any,
    resumeHtml: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/spec/analyze-similarity`, {
        jobRequirements,
        resumeHtml,
      });
      return { data: response.data, error: null };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          data: null,
          error: new Error(error.response?.data?.message || error.message || 'Failed to analyze similarity'),
        };
      }
      return { data: null, error: error as Error };
    }
  },
};