/**
 * API Service for the AI Spec Assistant
 * 
 * Handles communication with the backend API
 */

import axios from 'axios';

// Base URL for API requests - should match backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    const response = await apiClient.post('/spec/chat', {
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
    // In a real implementation, this would use FormData to upload actual files
    // For our MVP, we're just sending file metadata
    const filesMetadata = files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }));

    const response = await apiClient.post('/spec/upload', {
      conversationId,
      files: filesMetadata,
    });
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
    const response = await apiClient.get(`/spec/conversation/${conversationId}`);
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