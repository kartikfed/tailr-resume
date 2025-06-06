import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ApiResponse, Conversation, UploadResponse } from '../types';

// Type for uploadFiles payload
export interface UploadFilePayload {
  name: string;
  type: string;
  size: number;
  content: string;
  isPdf: boolean;
  useClaude: boolean;
}

export const apiService = {
  async sendMessage(
    conversationId: string,
    message: string,
    files: File[] = []
  ): Promise<ApiResponse<{ response: string }>> {
    try {
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      formData.append('message', message);
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await axios.post(`${API_BASE_URL}/chat`, formData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async uploadFiles(
    conversationId: string,
    files: UploadFilePayload[]
  ): Promise<ApiResponse<UploadResponse>> {
    try {
      // Send as JSON payload
      const response = await axios.post(`${API_BASE_URL}/upload`, {
        conversationId,
        files
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/conversation/${conversationId}`);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}; 