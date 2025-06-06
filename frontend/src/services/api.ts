import { API_BASE_URL } from '../config';
import { ApiResponse, UploadResponse } from '../types';

/**
 * Helper function to read file as base64
 */
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Upload files with HTML conversion
 */
export const uploadFilesHtml = async (conversationId: string, files: File[]): Promise<ApiResponse<UploadResponse>> => {
  try {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    
    const processedFiles = await Promise.all(files.map(async (file) => {
      const content = await readFileAsBase64(file);
      return {
        name: file.name,
        type: file.type,
        size: file.size,
        content,
        isPdf: file.type === 'application/pdf'
      };
    }));
    
    formData.append('files', JSON.stringify(processedFiles));
    
    const response = await fetch(`${API_BASE_URL}/upload-html`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error uploading files:', error);
    return { data: null, error: error as Error };
  }
}; 