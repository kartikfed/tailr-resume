/**
 * API Service for the AI Spec Assistant
 * 
 * Handles communication with the backend API
 */

import axios from 'axios';

// Base URL for API requests - should match backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Send a message to the AI Spec Assistant
 * 
 * @param {string} conversationId - Unique ID for the conversation
 * @param {string} message - User message
 * @param {Array} files - IDs of uploaded files to include as context
 * @returns {Promise} - API response
 */
export const sendMessage = async (conversationId, message, files = []) => {
  try {
    const response = await apiClient.post('/api/spec/chat', {
      conversationId,
      message,
      files,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Upload files to the AI Spec Assistant
 * 
 * @param {string} conversationId - Unique ID for the conversation
 * @param {Array} files - Files to upload
 * @returns {Promise} - API response with file metadata
 */
export const uploadFiles = async (conversationId, files) => {
  try {
    console.log('ApiService: About to upload files:', files.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      hasContent: Boolean(f.content),
      contentLength: f.content ? f.content.length : 0
    })));

    const payload = {
      conversationId,
      files: files
    };

    console.log('ApiService: Sending upload request with payload:', {
      conversationId,
      fileCount: files.length,
      fileTypes: files.map(f => f.type)
    });

    const response = await apiClient.post('/api/spec/upload', payload);
    
    console.log('ApiService: Received response:', response.data);
    console.log('ApiService: Response files:', response.data.files);
    console.log('ApiService: First file content type:', typeof response.data.files[0]?.content);
    console.log('ApiService: First file content preview:', response.data.files[0]?.content?.substring(0, 200) + '...');
    console.log('ApiService: First file content is JSON:', response.data.files[0]?.content?.startsWith('{'));
    console.log('ApiService: First file content is valid JSON:', (() => {
      try {
        JSON.parse(response.data.files[0]?.content || '');
        return true;
      } catch (e) {
        return false;
      }
    })());

    return response.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

/**
 * Get conversation history
 * 
 * @param {string} conversationId - Unique ID for the conversation
 * @returns {Promise} - API response with conversation history
 */
export const getConversation = async (conversationId) => {
  try {
    const response = await apiClient.get(`/api/spec/conversation/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting conversation:', error);
    throw error;
  }
};

export default {
  sendMessage,
  uploadFiles,
  getConversation,
};