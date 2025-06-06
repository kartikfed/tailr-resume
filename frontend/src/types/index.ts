export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface UploadResponse {
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    content: string;
    uploadedAt: string;
  }>;
} 