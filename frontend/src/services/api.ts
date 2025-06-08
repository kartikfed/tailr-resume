import { API_BASE_URL } from '../config';
import { ApiResponse, UploadResponse } from '../types';
import { readFileContent } from '../utils/fileReader';

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

/**
 * Convert PDF to HTML
 * @param {File} file - The PDF file to convert
 * @returns {Promise<{data: {html: string, validation?: any}, error: Error}>} - The converted HTML or error
 */
export const convertPdfToHtml = async (file: File): Promise<{ data: { html: string, validation?: any } | null; error: Error | null }> => {
  try {
    const content = await readFileContent(file, file.name);
    console.log('base64Content', content);

    const response = await fetch(`${API_BASE_URL}/pdf-to-html`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: content }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Get the response content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // Handle validation results
      const data = await response.json();
      console.log('PDF to HTML: Received validation results:', data.validation);
      return { data, error: null };
    } else {
      // Handle plain HTML response
      const html = await response.text();
      return { data: { html }, error: null };
    }
  } catch (error) {
    console.error('Error converting PDF to HTML:', error);
    return { data: null, error: error as Error };
  }
}; 