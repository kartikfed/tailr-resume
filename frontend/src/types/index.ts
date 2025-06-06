export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  linkedin_url: string;
  role_tags: string[];
  company_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
  }>;
}

export interface FileUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  uploadedAt: string;
}

export interface UploadResponse {
  message: string;
  files: FileUpload[];
} 